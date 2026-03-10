import { useRoomStore } from "@/store";
import { useMemo } from "react";
import { useSql } from "@sqlrooms/duckdb";
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
  color,
  mix,
} from "three/tsl";
import * as THREE from "three/webgpu";
import { latToMercatorY } from "@/lib/utils";
import colors from "tailwindcss/colors";
import chroma from "chroma-js";

const MAX_ARCS = 500;
const TUBE_RADIUS = 0.002;
const TUBE_SEGMENTS = 48;
const TUBE_RADIAL_SEGMENTS = 6;
const HEIGHT_FACTOR = 0.5;
const TILT_FACTOR = 0.2;


const Arcs = ({ ...props }) => {
  const flowsPerYear = useRoomStore((state) => state.flowsPerYear);
  const countriesGeoMap = useRoomStore((state) => state.countriesGeoMap);

  // const { data: topFlows } = useSql({
  //   query: /* sql */ `
  //     SELECT
  //       origin,
  //       destination,
  //       sim_remittances_with
  //     FROM mig_and_rem_avg_year
  //     ORDER BY sim_remittances_with DESC
  //     LIMIT ${MAX_ARCS}
  //   `,
  //   enabled: Boolean(migAndRemAvgYearReady),
  // });

  const { mesh, u } = useMemo(() => {
    if (!flowsPerYear || !countriesGeoMap) return {};

    const u = {
      srcColor: uniform(new THREE.Color(chroma(colors.orange['400']).hex())),
      tgtColor: uniform(new THREE.Color(chroma(colors.blue['400']).hex())),
      // srcColor: uniform(new THREE.Color("white")),
      // tgtColor: uniform(new THREE.Color("black")),
    }

    const flows = flowsPerYear.filter(d => d.year === 2019).slice(0, 500)

    // Build per-instance data
    const sources = [];
    const targets = [];
    const amounts = [];

    for (const flow of flows) {
      const originGeo = countriesGeoMap.get(flow.origin);
      const destGeo = countriesGeoMap.get(flow.destination);
      if (!originGeo || !destGeo) continue;

      sources.push(originGeo.longitude, latToMercatorY(originGeo.latitude), 0);
      targets.push(destGeo.longitude, latToMercatorY(destGeo.latitude), 0);
      amounts.push(flow.sim_remittances_with);
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

    // const material = new THREE.MeshBasicNodeMaterial({
    const material = new THREE.MeshPhysicalNodeMaterial({
      side: THREE.DoubleSide,
      roughness: 0.5,
      transparent: true,
      // metalness: 0.3,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.frustumCulled = false;

    // Instance buffers
    const srcBuffer = instancedArray(new Float32Array(sources), "vec3");
    const tgtBuffer = instancedArray(new Float32Array(targets), "vec3");
    const amountsBuffer = instancedArray(new Float32Array(amounts), "float");

    // Find max amount for normalization
    const maxAmount = Math.max(...amounts);

    material.positionNode = Fn(() => {
      const src = srcBuffer.element(instanceIndex);
      const tgt = tgtBuffer.element(instanceIndex);

      // Direction and distance
      const dx = tgt.x.sub(src.x);
      const dy = tgt.y.sub(src.y);
      const dist = dx.mul(dx).add(dy.mul(dy)).sqrt();
      const angle = atan(dy, dx);

      // Scale uniformly to preserve circular cross-section
      const scaled = positionLocal.mul(dist);

      // Rotate around Z axis so X aligns with source→target direction
      // Y (arc height) maps to world Z (toward camera)
      const cosA = cos(angle);
      const sinA = sin(angle);

      // Tilt: offset arc height into the perpendicular XY direction
      // Perpendicular to travel direction is (-sinA, cosA)
      // A→B and B→A have opposite angles, so tilt flips automatically
      const tilt = scaled.y.mul(float(TILT_FACTOR));

      const worldX = scaled.x.mul(cosA).add(scaled.z.mul(sinA.negate())).add(tilt.mul(sinA.negate()));
      const worldY = scaled.x.mul(sinA).add(scaled.z.mul(cosA)).add(tilt.mul(cosA));
      const worldZ = scaled.y; // height becomes Z

      // Midpoint of source and target
      const mid = src.add(tgt).mul(0.5);

      return vec3(
        worldX.add(mid.x),
        worldY.add(mid.y),
        worldZ,
      );
    })();

    material.colorNode = Fn(() => {
      const color = mix(u.tgtColor, u.srcColor, uv().x)

      return vec4(color, 1.0)
    })();

    return { mesh, u };
  }, [flowsPerYear, countriesGeoMap]);

  return <>{mesh && <primitive object={mesh} {...props} />}</>;
};

export default Arcs;
