import { useEffect, useMemo } from "react";
import { useRoomStore } from "@/store";
import {
  Fn,
  instancedArray,
  instanceIndex,
  positionLocal,
  smoothstep,
  uniformArray,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import * as THREE from "three/webgpu";
import { latToMercatorY } from "@/lib/utils";
import { index } from "d3-array";

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

    const buffers = {
      positions: positionsBuffer.value,
      sizes: sizesBuffer.value,
      types: typesBuffer.value,
    };

    // Nodes
    const u = {};

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
      const type = typesBuffer.element(instanceIndex);

      const distUV = uv().sub(vec2(0.5, 0.5)).length();
      const circle = smoothstep(0.5, 0.49, distUV);

      const color = colors.element(type.toInt());

      return vec4(color, circle.mul(0.9));
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

    console.log(disastersSorted);

    for (let i = 0; i < numPoints; i++) {
      const d = disastersSorted[i];

      const mercatorY = latToMercatorY(d.latitude);

      buffers.positions.array[i * 3] = d.longitude;
      buffers.positions.array[i * 3 + 1] = mercatorY;
      buffers.positions.array[i * 3 + 2] = 0;

      buffers.sizes.array[i] = rScale(d.affected) * 2;

      buffers.types.array[i] = disasterTypeIdx.get(d.disaster_type);
    }

    buffers.positions.needsUpdate = true;
    buffers.sizes.needsUpdate = true;
  }, [disasters, buffers, disastersRadiusScale, disasterTypeColorScale]);

  return <>{mesh && <primitive object={mesh} />}</>;
};

export default DisasterPoints;
