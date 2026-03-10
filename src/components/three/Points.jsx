import { useRoomStore } from "@/store";
import { useMemo } from "react";
import {
  Fn,
  instancedBufferAttribute,
  positionLocal,
  vec3,
  vec4,
} from "three/tsl";
import * as THREE from "three/webgpu";

const Points = ({ ...props }) => {
  // TODO: Create for all unique countries

  const flowsByOrigin = useRoomStore((state) => state.flowsByOrigin);
  const countriesGeo = useRoomStore((state) => state.countriesGeo);

  console.log(countriesGeo)

  // const data = useMemo(() => {
  //   if (!flowsByOrigin) return null;

  //   return flowsByOrigin.filter((d) => d.year === 2019);
  // }, [flowsByOrigin]);

  const { mesh } = useMemo(() => {
    if (!countriesGeo) return {};

    // Init buffers / attributes
    const positions = [];

    for (let i = 0; i < countriesGeo.length; i++) {
      const c = countriesGeo[i];

      positions.push(c.longitude, c.latitude, 0);
    }

    const positionAttribute = new THREE.InstancedBufferAttribute(
      new Float32Array(positions),
      3,
    );

    const geometry = new THREE.PlaneGeometry(1, 1);

    const material = new THREE.MeshPhysicalNodeMaterial({
      roughness: 0.5,
      metalness: 0.5,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, countriesGeo.length);
    mesh.frustumCulled = false

    material.colorNode = Fn(() => {
      return vec4(1, 0, 0, 1);
    })();

    // material.scaleNode = vec3(1);

    material.positionNode = Fn(() => {
      const offset = instancedBufferAttribute(positionAttribute);

      return positionLocal.add(offset);
    })();

    return { mesh };
  }, [countriesGeo]);

  return <>{mesh && <primitive object={mesh} {...props} />}</>;
};

export default Points;
