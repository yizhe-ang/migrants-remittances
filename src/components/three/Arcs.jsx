import { useRoomStore } from "@/store";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  Fn,
  instancedArray,
  uniformArray,
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
const TUBE_SEGMENTS = 24;
const TUBE_RADIAL_SEGMENTS = 4;
const HEIGHT_FACTOR = 0.5;
const TILT_FACTOR = 0.2;

const Arcs = (props) => {
  const hoveredCountry = useRoomStore((state) => state.hoveredCountry);
  const progressAnimRef = useRef(null);

  const flows = useRoomStore((state) => state.selectedFlows);
  const flowsPerYear = useRoomStore((state) => state.flowsPerYear);
  const flowsMap = useRoomStore((state) => state.flowsMap);
  const countriesGeoMap = useRoomStore((state) => state.countriesGeoMap);
  const flowRadiusScale = useRoomStore((state) => state.flowRadiusScale);
  const enableMapInteractions = useRoomStore(
    (state) => state.enableMapInteractions,
  );
  const pointsValue = useRoomStore((state) => state.pointsValue);
  const countriesAggStatsMap = useRoomStore((state) => state.countriesAggStatsMap);

  const setArcs = useRoomStore((state) => state.setArcs);

  // Compute max flow count across all years for pre-allocation
  const maxFlowCount = useMemo(() => {
    if (!flowsPerYear) return null;

    const countsByYear = new Map();
    for (const flow of flowsPerYear) {
      countsByYear.set(flow.year, (countsByYear.get(flow.year) || 0) + 1);
    }

    let max = 0;
    for (const count of countsByYear.values()) {
      if (count > max) max = count;
    }
    return max;
  }, [flowsPerYear]);

  // Create mesh once with max instance count — stable across year changes
  const { mesh, u, buffers } = useMemo(() => {
    if (!maxFlowCount || !flowRadiusScale) return {};

    const u = {
      // srcColor: uniform(new THREE.Color(chroma(colors.blue["400"]).hex())),
      // tgtColor: uniform(new THREE.Color(chroma(colors.orange["400"]).hex())),
      srcColor: uniform(new THREE.Color(chroma(colors.stone["400"]).hex())),
      tgtColor: uniform(new THREE.Color(chroma(colors.stone["400"]).hex())),
      opacity: uniform(1),
      staggeredT: uniform(0),
      // Wind streaks style (0 = default, 1 = wind streaks)
      windStreaksT: uniform(0),
      // windColor: uniform(new THREE.Color("#b0c4de")),
      windColor: uniform(new THREE.Color(chroma(colors.stone[500]).hex())),
      // Wind color mode (0 = solid windColor, 1 = srcColor/tgtColor gradient)
      windGradientT: uniform(0),
      // Arc drawing direction (0 = default, 1 = reversed)
      directionT: uniform(0),
    };

    // Pre-allocate buffers with max count (filled with zeros)
    const srcBuffer = instancedArray(maxFlowCount, "vec3");
    const tgtBuffer = instancedArray(maxFlowCount, "vec3");
    const progressBuffer = instancedArray(maxFlowCount, "float");
    const radiusBuffer = instancedArray(maxFlowCount, "float");
    const srcTypeBuffer = instancedArray(maxFlowCount, "float");
    const tgtTypeBuffer = instancedArray(maxFlowCount, "float");

    // 4-entry color lookup table indexed by income group (matches incomeColorScale domain order):
    // 0=High income, 1=Upper middle income, 2=Lower middle income, 3=Low income
    const incomeColors = uniformArray(
      [
        new THREE.Color("#7fc97f"),
        new THREE.Color("#beaed4"),
        new THREE.Color("#fdc086"),
        new THREE.Color("#ffed6f"),
      ],
      "color",
    );

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
      // roughness: 0.5,
      transparent: true,
      depthWrite: false,
      // metalness: 0.3,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, maxFlowCount);
    mesh.frustumCulled = false;
    mesh.renderOrder = 2;
    mesh.count = 0; // Start with nothing visible until buffer update runs

    material.positionNode = Fn(() => {
      const src = srcBuffer.element(instanceIndex);
      const tgt = tgtBuffer.element(instanceIndex);

      // Collapse invisible arcs to degenerate triangles (GPU culls zero-area triangles
      // before fragment shading, avoiding expensive noise/discard for 900+ hidden arcs)
      const progressBase = progressBuffer.element(instanceIndex);
      const isVisible = progressBase
        .add(u.staggeredT)
        .greaterThan(0.001)
        .toFloat();

      // Direction and distance
      const dx = tgt.x.sub(src.x);
      const dy = tgt.y.sub(src.y);
      const dist = dx.mul(dx).add(dy.mul(dy)).sqrt();
      const angle = atan(dy, dx);

      // Scale arc shape by distance, cross-section by per-instance radius
      const radius = radiusBuffer.element(instanceIndex);
      const effectiveRadius = mix(radius, radius.mul(0.4), u.windStreaksT);
      const arcT = positionLocal.x.add(0.5);

      // const edgeWidth = float(0.12);
      // const edgeWidth = float(0.5);
      // const taper = smoothstep(float(0), edgeWidth, arcT)
        // .mul(smoothstep(float(1), float(1).sub(edgeWidth), arcT));
      // const taperFactor = mix(taper, float(1), u.windStreaksT);
      const scaled = vec3(
        positionLocal.x.mul(dist),
        positionLocal.y.mul(dist),
        // positionLocal.z.mul(effectiveRadius).mul(taperFactor),
        positionLocal.z.mul(effectiveRadius)
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

      const finalPos = vec3(worldX.add(mid.x), worldY.add(mid.y), worldZ);
      return mix(vec3(0, 0, 0), finalPos, isVisible);
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

      // Staggered draw-in: each arc draws at a different time as staggeredT goes 0→1
      const instanceStagger = u.staggeredT.mul(2).sub(randOffset).clamp(0, 1);

      const progress = progressBase.add(instanceStagger).mod(1);

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
      const t = mix(float(1).sub(uv().x), uv().x, u.directionT);

      If(t.lessThan(low).or(t.greaterThan(high)), () => {
        Discard();
      });

      // Base color: solid windColor or per-instance income colors gradient, controlled by windGradientT
      const srcColorInst = incomeColors.element(srcTypeBuffer.element(instanceIndex).toInt().clamp(0, 3));
      const tgtColorInst = incomeColors.element(tgtTypeBuffer.element(instanceIndex).toInt().clamp(0, 3));
      const baseColor = mix(
        u.windColor,
        mix(tgtColorInst, srcColorInst, t),
        u.windGradientT,
      );

      // Wind streaks: directional fade (head bright, tail fades)
      const fadeT = smoothstep(low, high, t);
      const windOpacity = fadeT.mul(1);

      // Surface texture: noise driven by UV position and instance seed
      // const texCoord = vec3(
      //   uv().x.mul(12), // along the arc
      //   uv().y.mul(6), // around the tube circumference
      //   seed.mul(0.1), // per-instance variation
      // );
      // const surfaceNoise = mx_noise_float(texCoord).mul(0.5).add(0.5);
      // Subtle brightness variation (0.8–1.0 range)
      // const textureFactor = surfaceNoise.mul(0.3).add(0.7);
      // const textureFactor = surfaceNoise.mul(0.8).add(0.2);

      // Color is shared across modes; opacity differentiates them
      // const c = baseColor.mul(textureFactor);
      const c = baseColor;
      const alpha = mix(u.opacity, windOpacity.mul(u.opacity), u.windStreaksT);

      return vec4(c, alpha);
    })();

    return {
      mesh,
      u,
      buffers: {
        src: srcBuffer.value,
        tgt: tgtBuffer.value,
        radius: radiusBuffer.value,
        progress: progressBuffer.value,
        srcType: srcTypeBuffer.value,
        tgtType: tgtTypeBuffer.value,
      },
    };
  }, [maxFlowCount, flowRadiusScale]);

  // Imperatively update buffers when selectedFlows changes (year change)
  useLayoutEffect(() => {
    if (!flows || !mesh || !buffers || !countriesGeoMap || !flowRadiusScale || !countriesAggStatsMap)
      return;

    const srcArr = buffers.src.array;
    const tgtArr = buffers.tgt.array;
    const radiusArr = buffers.radius.array;
    const progressArr = buffers.progress.array;
    const srcTypeArr = buffers.srcType.array;
    const tgtTypeArr = buffers.tgtType.array;

    const incomeGroups = ["High income", "Upper middle income", "Lower middle income", "Low income"];

    let count = 0;
    for (const flow of flows) {
      const originGeo = countriesGeoMap.get(flow.origin);
      const destGeo = countriesGeoMap.get(flow.destination);
      if (!originGeo || !destGeo) continue;

      const i3 = count * 3;
      srcArr[i3] = originGeo.longitude;
      srcArr[i3 + 1] = latToMercatorY(originGeo.latitude);
      srcArr[i3 + 2] = 0;

      tgtArr[i3] = destGeo.longitude;
      tgtArr[i3 + 1] = latToMercatorY(destGeo.latitude);
      tgtArr[i3 + 2] = 0;

      radiusArr[count] = flowRadiusScale(flow.sim_remittances_with);
      progressArr[count] = 0;

      const originStats = countriesAggStatsMap.get(flow.origin);
      const destStats = countriesAggStatsMap.get(flow.destination);
      srcTypeArr[count] = incomeGroups.indexOf(originStats?.group ?? "");
      tgtTypeArr[count] = incomeGroups.indexOf(destStats?.group ?? "");

      count++;
    }

    mesh.count = count;

    buffers.src.needsUpdate = true;
    buffers.tgt.needsUpdate = true;
    buffers.radius.needsUpdate = true;
    buffers.progress.needsUpdate = true;
    buffers.srcType.needsUpdate = true;
    buffers.tgtType.needsUpdate = true;
  }, [flows, mesh, buffers, countriesGeoMap, flowRadiusScale, countriesAggStatsMap]);

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

    // if (pointsValue[0] !== "absolute") return;

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
