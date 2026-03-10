import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three/webgpu";
import { Fn, texture, uv } from "three/tsl";

const WorldMap = () => {
  const dayTexture = useTexture("/textures/earth/day.jpg");
  dayTexture.colorSpace = THREE.SRGBColorSpace;

  const { mesh } = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(360, 180);

    const material = new THREE.MeshPhysicalNodeMaterial({
      // roughness: 0.5,
      // metalness: 0.5,
    });

    const mesh = new THREE.Mesh(geometry, material);

    material.colorNode = Fn(() => {
      const color = texture(dayTexture, uv()).toVar();

      color.mulAssign(30.0);

      return color;
    })();

    return { mesh };
  }, []);

  return (
    <>
      <primitive object={mesh} />
    </>
  );
};

export default WorldMap;
