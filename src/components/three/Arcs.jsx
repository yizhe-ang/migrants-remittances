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
} from "three/tsl";
import * as THREE from "three/webgpu";
import { latToMercatorY, transitionBuffer } from "@/lib/utils";
import colors from "tailwindcss/colors";
import chroma from "chroma-js";
import { hash } from "@/lib/tsl";

const TUBE_RADIUS = 0.002;
const TUBE_SEGMENTS = 48;
const TUBE_RADIAL_SEGMENTS = 6;
const HEIGHT_FACTOR = 0.5;
const TILT_FACTOR = 0.2;

const Arcs = ({ ...props }) => {
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
      progressT: uniform(0),
      widthT: uniform(0),
      // Movement animation
      movementT: uniform(0),
    };

    // Build per-instance data
    const sources = [];
    const targets = [];
    const progressFrom = [];
    const progressTo = [];
    const radii = [];

    for (const flow of flows) {
      const originGeo = countriesGeoMap.get(flow.origin);
      const destGeo = countriesGeoMap.get(flow.destination);
      if (!originGeo || !destGeo) continue;

      sources.push(originGeo.longitude, latToMercatorY(originGeo.latitude), 0);
      targets.push(destGeo.longitude, latToMercatorY(destGeo.latitude), 0);

      progressFrom.push(0.5);
      progressTo.push(0);

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
    const progressFromBuffer = instancedArray(
      new Float32Array(progressFrom),
      "float",
    );
    const progressToBuffer = instancedArray(
      new Float32Array(progressTo),
      "float",
    );
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
      const scaled = vec3(
        positionLocal.x.mul(dist),
        positionLocal.y.mul(dist),
        positionLocal.z.mul(radius),
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

      const progressFrom = progressFromBuffer.element(instanceIndex);
      const progressTo = progressToBuffer.element(instanceIndex);
      const progressBase = mix(progressFrom, progressTo, u.progressT);

      // Draw randomly: per-arc phase offset + per-arc speed
      // const randOffset = randomOffsetBuffer.element(instanceIndex);
      // const randSpeed = randomSpeedBuffer.element(instanceIndex);
      // const progress = progressBase
      //   .add(time.mul(randSpeed))
      //   .add(randOffset)
      //   .mod(1);

      const randOffset = hash(seed).mul(10)
      const randSpeed = hash(seed.add(1)).mul(0.1);

      const progress = progressBase
        .add(time.mul(randSpeed))
        .add(randOffset)
        .mod(1);

      // Draw phase (0→0.5): high goes 0→1, low stays 0
      // Undraw phase (0.5→1): low goes 0→1, high stays 1
      const low = progress.mul(2).sub(1).max(0);
      const high = progress.mul(2).min(1);
      const t = float(1).sub(uv().x);

      If(t.lessThan(low).or(t.greaterThan(high)), () => {
        Discard();
      });

      const c = mix(u.tgtColor, u.srcColor, t);
      return vec4(c, 1);
    })();

    // const computeUpdate = Fn(() => {
    //   const currentProgress = progressFromBuffer.element(instanceIndex);
    //   const targetProgress = progressFromBuffer.element(instanceIndex);

    //   currentProgress.addAssign(
    //     targetProgress.sub(currentProgress).mul(1.0).mul(deltaTime),
    //   );
    // })().compute(count);

    return {
      mesh,
      u,
      buffers: {
        progress: {
          from: progressFromBuffer,
          to: progressToBuffer,
        },
      },
    };
  }, [flows, countriesGeoMap, flowRadiusScale]);

  useEffect(() => {
    if (!u || !buffers) return;

    setArcs({
      u,
      buffers,
    });
  }, [u, buffers]);

  useEffect(() => {
    if (!enableMapInteractions) return;
    if (!buffers || !u || !flowsMap) return;

    const targets = new Float32Array(buffers.progress.to.value.array.length);
    if (hoveredCountry) {
      const { country, type } = hoveredCountry;
      const indexMap =
        type === "origin"
          ? flowsMap.get("origin")
          : flowsMap.get("destination");
      const indices = indexMap?.get(country).map((d) => d.idx) || [];
      for (const i of indices) {
        targets[i] = 0.5;
      }
    }

    progressAnimRef.current = transitionBuffer(
      buffers.progress.from,
      buffers.progress.to,
      u.progressT,
      targets,
    );

    return () => progressAnimRef.current?.stop();
  }, [hoveredCountry, buffers, u, flowsMap, enableMapInteractions]);

  return <>{mesh && <primitive object={mesh} {...props} />}</>;
};

export default Arcs;
