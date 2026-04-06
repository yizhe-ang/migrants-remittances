import { useEffect, useMemo } from "react";
import { useRoomStore } from "@/store";
import {
  float,
  Fn,
  instancedArray,
  instanceIndex,
  mix,
  positionLocal,
  smoothstep,
  time,
  uniform,
  uniformArray,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import * as THREE from "three/webgpu";
import { latToMercatorY } from "@/lib/utils";
import { folder, useControls } from "leva";

const DATE_RANGE_START = Date.UTC(2010, 0, 1);
const DATE_RANGE_END = Date.UTC(2020, 0, 1);
const DATE_RANGE_SPAN = DATE_RANGE_END - DATE_RANGE_START;

const normalizeDateToRange = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return 0;

  return THREE.MathUtils.clamp(
    (date.getTime() - DATE_RANGE_START) / DATE_RANGE_SPAN,
    0,
    1,
  );
};

const DisasterPoints = () => {
  const disasters = useRoomStore((state) => state.disasters);
  const disastersRadiusScale = useRoomStore(
    (state) => state.disastersRadiusScale,
  );
  const disasterTypeColorScale = useRoomStore(
    (state) => state.disasterTypeColorScale,
  );

  const numPoints = disasters?.length;

  const { mesh, u, buffers } = useMemo(() => {
    if (!disasters) return {};

    const geometry = new THREE.PlaneGeometry(1, 1);

    const material = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, numPoints);

    mesh.frustumCulled = false;
    // mesh.renderOrder = 10;

    // Init buffers
    const positionsBuffer = instancedArray(numPoints, "vec3");
    const sizesBuffer = instancedArray(numPoints, "float");
    const typesBuffer = instancedArray(numPoints, "float");
    const startsBuffer = instancedArray(numPoints, "float");
    const endsBuffer = instancedArray(numPoints, "float");

    const buffers = {
      positions: positionsBuffer.value,
      sizes: sizesBuffer.value,
      types: typesBuffer.value,
      starts: startsBuffer.value,
      ends: endsBuffer.value,
    };

    // Nodes
    const u = {
      dateT: uniform(0),
    };

    const disasterColors = disasterTypeColorScale.range();

    const colors = uniformArray(
      [
        new THREE.Color(disasterColors[0]),
        new THREE.Color(disasterColors[1]),
        new THREE.Color(disasterColors[2]),
        new THREE.Color(disasterColors[3]),
      ],
      "color",
    );

    material.positionNode = Fn(() => {
      const position = positionsBuffer.element(instanceIndex);
      const size = sizesBuffer.element(instanceIndex);

      return positionLocal.mul(size).add(position);
    })();

    material.colorNode = Fn(() => {
      const opacity = 0.7;

      const type = typesBuffer.element(instanceIndex);
      const start = startsBuffer.element(instanceIndex);
      const end = endsBuffer.element(instanceIndex);

      const buffer = 0.05;
      const startBuffered = start.sub(buffer);
      const endBuffered = end.add(buffer);

      const dist = uv().sub(vec2(0.5)).length();
      const circle = smoothstep(0.5, 0.45, dist);

      // Wave animation
      // const waveT = time.mul(0.3).mod(1);
      const waveT = u.dateT
        .sub(startBuffered)
        .div(endBuffered.sub(startBuffered))
        .saturate();

      const distGrow = dist.add(mix(0.5, 0, waveT));

      // Circle
      const wave = smoothstep(0.5, 0.45, distGrow);
      // Inner transparent circle
      wave.mulAssign(smoothstep(0.01, 0.45, distGrow));
      // Fade out at the end
      wave.mulAssign(smoothstep(1, 0.9, waveT));

      const color = colors.element(type.toInt().clamp(0, 3));

      // const alpha = circle.mul(opacity)
      const alpha = wave.mul(opacity);

      return vec4(color, alpha);
    })();

    return {
      u,
      mesh,
      buffers,
    };
  }, [disasters]);

  useEffect(() => {
    if (
      !disasters ||
      !buffers ||
      !disastersRadiusScale ||
      !disasterTypeColorScale
    )
      return;

    const disasterTypeIdx = new Map(
      disasterTypeColorScale.domain().map((type, i) => [type, i]),
    );

    // Adjust radius scale
    const rScale = disastersRadiusScale.copy().range([2, 35]);

    // Smaller circles appear on top
    const disastersSorted = [...disasters].sort(
      (a, b) => b.affected - a.affected,
    );

    for (let i = 0; i < numPoints; i++) {
      const d = disastersSorted[i];

      const mercatorY = latToMercatorY(d.latitude);

      buffers.positions.array[i * 3] = d.longitude;
      buffers.positions.array[i * 3 + 1] = mercatorY;
      buffers.positions.array[i * 3 + 2] = 0;

      buffers.sizes.array[i] = rScale(d.affected) * 2;

      buffers.types.array[i] = disasterTypeIdx.get(d.disaster_type);
      buffers.starts.array[i] = normalizeDateToRange(d.start_date);
      buffers.ends.array[i] = normalizeDateToRange(d.end_date);
    }

    buffers.positions.needsUpdate = true;
    buffers.sizes.needsUpdate = true;
    buffers.types.needsUpdate = true;
    buffers.starts.needsUpdate = true;
    buffers.ends.needsUpdate = true;
  }, [disasters, buffers, disastersRadiusScale, disasterTypeColorScale]);

  useControls(
    {
      "disaster points": folder({
        dateT: {
          value: 0,
          min: 0,
          max: 1,
          step: 0.001,
          onChange: (v) => {
            if (!u) return;
            u.dateT.value = v;
          },
        },
      }),
    },
    [u],
  );

  return <>{mesh && <primitive object={mesh} />}</>;
};

export default DisasterPoints;
