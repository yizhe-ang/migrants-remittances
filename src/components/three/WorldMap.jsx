import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three/webgpu";
import { Fn, float, texture, uv, vec2 } from "three/tsl";

const WorldMap = ({...props}) => {
  const dayTexture = useTexture("/textures/earth/day.jpg");
  dayTexture.colorSpace = THREE.SRGBColorSpace;

  const { mesh } = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(360, 360);

    const material = new THREE.MeshPhysicalNodeMaterial({
      // roughness: 0.5,
      // metalness: 0.5,
    });

    const mesh = new THREE.Mesh(geometry, material);

    material.colorNode = Fn(() => {
      // Remap v from Mercator space back to equirectangular
      // UV v (0→1) maps to Mercator y (-180→+180)
      const mercY = uv().y.mul(2.0).sub(1.0).mul(Math.PI); // -π to π
      const lat = float(2.0).mul(mercY.exp().atan()).sub(Math.PI / 2); // inverse Mercator → latitude in radians
      const equirectV = lat.div(Math.PI).add(0.5); // latitude (-π/2→π/2) → v (0→1)

      const correctedUV = vec2(uv().x, equirectV);
      const color = texture(dayTexture, correctedUV).toVar();

      color.mulAssign(40.0).saturate();

      return color;
    })();

    return { mesh };
  }, []);

  return (
    <>
      <primitive object={mesh} {...props} />
    </>
  );
};

export default WorldMap;
