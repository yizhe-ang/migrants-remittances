import { useRoomStore } from "@/store";
import { useEffect, useMemo, useRef } from "react";
import {
  Fn,
  instancedArray,
  positionLocal,
  instanceIndex,
  vec3,
  float,
  cos,
  sin,
  atan,
  uv,
  vec4,
  uniform,
  mix,
  If,
  Discard,
  time,
  mx_noise_float,
  smoothstep,
} from "three/tsl";
import * as THREE from "three/webgpu";
import { latToMercatorY } from "@/lib/utils";
import { animate } from "motion";
import colors from "tailwindcss/colors";
import chroma from "chroma-js";
import { hash } from "@/lib/tsl";

const TUBE_RADIUS = 0.002;
const TUBE_SEGMENTS = 48;
const TUBE_RADIAL_SEGMENTS = 6;
const HEIGHT_FACTOR = 0.5;
const TILT_FACTOR = 0.2;

const Arcs = (props) => {
  const hoveredCountry = useRoomStore((state) => state.hoveredCountry);
  const progressAnimRef = useRef(null);

  const flows = useRoomStore((state) => state.selectedFlows);
  const flowsMap = useRoomStore((state) => state.flowsMap);
  const countriesGeoMap = useRoomStore((state) => state.countriesGeoMap);
  const flowRadiusScale = useRoomStore((state) => state.flowRadiusScale);
  const enableMapInteractions = useRoomStore(
    (state) => state.enableMapInteractions,
  );

  const setArcs = useRoomStore((state) => state.setArcs);

  const { mesh, u, buffers } = useMemo(() => {
    if (!flows || !countriesGeoMap || !flowRadiusScale) return {};

    const u = {
      srcColor: uniform(new THREE.Color(chroma(colors.blue["400"]).hex())),
      tgtColor: uniform(new THREE.Color(chroma(colors.orange["400"]).hex())),
      // Movement animation
      movementT: uniform(0),
      opacity: uniform(1),
      staggeredT: uniform(0),
      // Wind streaks style (0 = default, 1 = wind streaks)
      windStreaksT: uniform(1),
      // windColor: uniform(new THREE.Color("#b0c4de")),
      windColor: uniform(new THREE.Color(chroma(colors.stone[600]).hex())),
    };

    // Build per-instance data
    const sources = [];
    const targets = [];
    const progress = [];
    const radii = [];

    for (const flow of flows) {
      const originGeo = countriesGeoMap.get(flow.origin);
      const destGeo = countriesGeoMap.get(flow.destination);
      if (!originGeo || !destGeo) continue;

      sources.push(originGeo.longitude, latToMercatorY(originGeo.latitude), 0);
      targets.push(destGeo.longitude, latToMercatorY(destGeo.latitude), 0);

      progress.push(0);

      radii.push(flowRadiusScale(flow.sim_remittances_with));
    }

    const count = flows.length;

    // Canonical arc: height baked into curve so we can scale uniformly
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.5, 0, 0),
      new THREE.Vector3(0, HEIGHT_FACTOR, 0),
      new THREE.Vector3(0.5, 0, 0),
    );

    const geometry = new THREE.TubeGeometry(
      curve,
      TUBE_SEGMENTS,
      TUBE_RADIUS,
      TUBE_RADIAL_SEGMENTS,
      false,
    );

    const material = new THREE.MeshBasicNodeMaterial({
      // const material = new THREE.MeshPhysicalNodeMaterial({
      side: THREE.DoubleSide,
      roughness: 0.5,
      transparent: true,
      depthWrite: false,
      // metalness: 0.3,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.frustumCulled = false;
    mesh.renderOrder = 2;

    // Instance buffers
    const srcBuffer = instancedArray(new Float32Array(sources), "vec3");
    const tgtBuffer = instancedArray(new Float32Array(targets), "vec3");
    const progressBuffer = instancedArray(new Float32Array(progress), "float");
    const radiusBuffer = instancedArray(new Float32Array(radii), "float");

    material.positionNode = Fn(() => {
      const src = srcBuffer.element(instanceIndex);
      const tgt = tgtBuffer.element(instanceIndex);

      // Direction and distance
      const dx = tgt.x.sub(src.x);
      const dy = tgt.y.sub(src.y);
      const dist = dx.mul(dx).add(dy.mul(dy)).sqrt();
      const angle = atan(dy, dx);

      // Scale arc shape by distance, cross-section by per-instance radius
      const radius = radiusBuffer.element(instanceIndex);
      const effectiveRadius = mix(radius, radius.mul(0.4), u.windStreaksT);
      const scaled = vec3(
        positionLocal.x.mul(dist),
        positionLocal.y.mul(dist),
        positionLocal.z.mul(effectiveRadius),
      );

      // Rotate around Z axis so X aligns with source→target direction
      // Y (arc height) maps to world Z (toward camera)
      const cosA = cos(angle);
      const sinA = sin(angle);

      // Tilt: offset arc height into the perpendicular XY direction
      // Perpendicular to travel direction is (-sinA, cosA)
      // A→B and B→A have opposite angles, so tilt flips automatically
      const tilt = scaled.y.mul(float(TILT_FACTOR));

      const worldX = scaled.x
        .mul(cosA)
        .add(scaled.z.mul(sinA.negate()))
        .add(tilt.mul(sinA.negate()));
      const worldY = scaled.x
        .mul(sinA)
        .add(scaled.z.mul(cosA))
        .add(tilt.mul(cosA));
      const worldZ = scaled.y; // height becomes Z

      // Midpoint of source and target
      const mid = src.add(tgt).mul(0.5);

      return vec3(worldX.add(mid.x), worldY.add(mid.y), worldZ);
    })();

    material.colorNode = Fn(() => {
      const seed = instanceIndex.toFloat();

      const progressBase = progressBuffer.element(instanceIndex);

      // Draw randomly
      const randOffset = hash(seed);
      const baseSpeed = hash(seed.add(1)).mul(0.05).add(0.05).mul(5);

      const noise = mx_noise_float(vec3(seed, time.mul(0.2), 0.0))
        .mul(0.5)
        .add(0.5);
      const wobble = noise.mul(0.5);

      const randomProgress = mix(
        0,
        time.mul(baseSpeed).add(randOffset.mul(7)).add(wobble),
        u.movementT,
      );

      // Staggered draw-in: each arc draws at a different time as staggeredT goes 0→1
      const instanceStagger = u.staggeredT.mul(2).sub(randOffset).clamp(0, 1);

      const progress = progressBase
        .add(randomProgress)
        .add(instanceStagger)
        .mod(mix(1, 7, u.movementT));

      // Default: draw/undraw window
      const defaultLow = progress.mul(2).sub(1).max(0);
      const defaultHigh = progress.mul(2).min(1);

      // --- Wind streaks mode ---
      // Visibility gate from progressBase (same draw/undraw as default)
      const windGateProgress = progressBase.add(instanceStagger).mod(1);
      const gateLow = windGateProgress.mul(2).sub(1).max(0);
      const gateHigh = windGateProgress.mul(2).min(1);

      // Flowing streaks within the visible window
      const windSpeed = baseSpeed.mul(2);
      const windPhase = time.mul(windSpeed).add(randOffset.mul(5)).add(wobble);
      // Each streak covers 25% of the arc length, cycling through the gate
      const streakLen = float(0.25);
      const streakProgress = windPhase.fract();
      const streakCenter = mix(gateLow, gateHigh, streakProgress);
      const windLow = streakCenter.sub(streakLen.mul(0.5)).max(gateLow);
      const windHigh = streakCenter.add(streakLen.mul(0.5)).min(gateHigh);

      // Blend low/high between default and wind modes
      const low = mix(defaultLow, windLow, u.windStreaksT);
      const high = mix(defaultHigh, windHigh, u.windStreaksT);
      const t = float(1).sub(uv().x);

      If(t.lessThan(low).or(t.greaterThan(high)), () => {
        Discard();
      });

      // Default: gradient from target to source color
      const defaultColor = mix(u.tgtColor, u.srcColor, t);

      // Wind streaks: single color with directional fade (head bright, tail fades)
      const fadeT = smoothstep(low, high, t);
      // const windOpacity = fadeT.mul(0.9);
      const windOpacity = fadeT.mul(1);

      // Blend color and opacity between modes
      const c = mix(defaultColor, u.windColor, u.windStreaksT);
      const alpha = mix(u.opacity, windOpacity.mul(u.opacity), u.windStreaksT);

      return vec4(c, alpha);
    })();

    return {
      mesh,
      u,
      buffers: {
        progress: progressBuffer.value,
      },
    };
  }, [flows, countriesGeoMap, flowRadiusScale]);

  useEffect(() => {
    if (!u || !buffers || !flowsMap) return;

    setArcs({
      u,
      buffers,
      getProgressTargetsFromTypeCountry: ({ country, type }) => {
        const targets = new Float32Array(buffers.progress.array.length);

        const flows = flowsMap.get(type).get(country);

        flows.forEach((d) => {
          targets[d.idx] = 0.5;
        });

        return targets;
      },
    });
  }, [u, buffers, flowsMap]);

  useEffect(() => {
    if (!enableMapInteractions) return;
    if (!buffers || !flowsMap) return;

    const arr = buffers.progress.array;
    const snapshot = arr.slice();
    const targets = new Float32Array(arr.length);

    if (hoveredCountry) {
      const { country, type } = hoveredCountry;

      const flows = flowsMap.get(type).get(country);
      flows.forEach((d) => {
        targets[d.idx] = 0.5;
      });
    }

    progressAnimRef.current = animate(0, 1, {
      duration: 0.5,
      ease: "easeOut",
      onUpdate: (t) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = snapshot[i] + (targets[i] - snapshot[i]) * t;
        }
        buffers.progress.needsUpdate = true;
      },
    });

    return () => progressAnimRef.current?.stop();
  }, [hoveredCountry, buffers, flowsMap, enableMapInteractions]);

  return <>{mesh && <primitive object={mesh} {...props} />}</>;
};

export default Arcs;
