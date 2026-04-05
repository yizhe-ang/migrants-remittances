import { useEffect, useMemo } from "react";
import { useRoomStore } from "@/store";
import {
  Fn,
  instancedArray,
  instanceIndex,
  positionLocal,
  vec3,
} from "three/tsl";
import * as THREE from "three/webgpu";
import { latToMercatorY } from "@/lib/utils";

const DisasterPoints = () => {
  const disasters = useRoomStore((state) => state.disasters);

  console.log(disasters);

  const numPoints = disasters?.length;

  const { mesh, u, buffers } = useMemo(() => {
    if (!disasters) return {};

    const u = {};

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

    const buffers = {
      positions: positionsBuffer.value,
      sizes: sizesBuffer.value,
    };

    // Nodes
    material.positionNode = Fn(() => {
      const position = positionsBuffer.element(instanceIndex);
      const size = sizesBuffer.element(instanceIndex);

      return positionLocal.mul(size).add(position);
    })();

    material.colorNode = Fn(() => {
      return vec3(1.0, 0.0, 0.0);
    })();

    return {
      u,
      mesh,
      buffers,
    };
  }, [disasters]);

  useEffect(() => {
    if (!disasters || !buffers) return;

    console.log(buffers.positions);

    for (let i = 0; i < numPoints; i++) {
      const d = disasters[i];

      const mercatorY = latToMercatorY(d.latitude);

      buffers.positions.array[i * 3] = d.longitude;
      buffers.positions.array[i * 3 + 1] = mercatorY;
      buffers.positions.array[i * 3 + 2] = 0;

      buffers.sizes.array[i] = 10;
    }

    buffers.positions.needsUpdate = true;
    buffers.sizes.needsUpdate = true;
  }, [disasters, buffers]);

  return <>{mesh && <primitive object={mesh} />}</>;
};

export default DisasterPoints;
