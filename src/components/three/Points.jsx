import { useRoomStore } from "@/store";
import { useMemo } from "react";
import {
  Fn,
  instancedArray,
  instancedBufferAttribute,
  positionLocal,
  instanceIndex,
  vec3,
  vec4,
  uv,
  vec2,
  smoothstep,
  cameraPosition,
} from "three/tsl";
import * as THREE from "three/webgpu";

const dummy = new THREE.Object3D();

const Points = ({ ...props }) => {
  // TODO: Create for all unique countries

  const flowsByOrigin = useRoomStore((state) => state.flowsByOrigin);
  const countriesGeo = useRoomStore((state) => state.countriesGeo);

  const data = useMemo(() => {
    if (!flowsByOrigin) return null;

    return flowsByOrigin.filter((d) => d.year === 2019);
  }, [flowsByOrigin]);

  const { mesh } = useMemo(() => {
    if (!countriesGeo) return {};

    const geometry = new THREE.PlaneGeometry(1, 1);

    const material = new THREE.MeshPhysicalNodeMaterial({
      roughness: 0.5,
      metalness: 0.5,
      transparent: true,
    });

    const mesh = new THREE.InstancedMesh(
      geometry,
      material,
      countriesGeo.length,
    );
    mesh.frustumCulled = false;

    // Init buffers / attributes
    const positions = [];
    const sizes = [];

    for (let i = 0; i < countriesGeo.length; i++) {
      const c = countriesGeo[i];

      // positions.push(c.longitude, c.latitude, 0);
      positions.push(0, 0, 0);

      // Set instance matrices for raycasting
      dummy.position.set(c.longitude, c.latitude, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      sizes.push(1);
    }
    mesh.instanceMatrix.needsUpdate = true;

    const positionsBuffer = instancedArray(new Float32Array(positions), "vec3");
    const sizesBuffer = instancedArray(new Float32Array(sizes), "float");

    material.colorNode = Fn(() => {
      const distUV = uv().sub(vec2(0.5, 0.5)).length();
      const edge = smoothstep(0.48, 0.5, distUV).oneMinus();

      return vec4(1, 0, 0, edge);
    })();

    material.positionNode = Fn(() => {
      const offset = positionsBuffer.element(instanceIndex);
      const size = sizesBuffer.element(instanceIndex);

      const dist = cameraPosition.sub(offset).length();
      const scale = size.mul(dist).mul(0.01);

      return positionLocal.mul(scale).add(offset);
    })();

    return { mesh };
  }, [countriesGeo]);

  return (
    <>
      {mesh && (
        <primitive
          object={mesh}
          onClick={(e) => {
            e.stopPropagation();
            console.log(e.instanceId);
          }}
          {...props}
        />
      )}
    </>
  );
};

export default Points;
