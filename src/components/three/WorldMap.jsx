import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three/webgpu";
import {
  Fn,
  float,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
} from "three/tsl";
import useVerletSystem from "./useVerletSystem";

const WorldMap = ({ ...props }) => {
  const dayTexture = useTexture("/textures/earth/day.jpg");
  dayTexture.colorSpace = THREE.SRGBColorSpace;

  const mesh = useVerletSystem();

  const { uniforms } = useMemo(() => {
    // const geometry = new THREE.PlaneGeometry(360, 360);

    const fadeX = uniform(0.15);
    const fadeY = uniform(0.15);

    // const material = new THREE.MeshPhysicalNodeMaterial({
    // const material = new THREE.MeshBasicNodeMaterial({
    // transparent: true,
    // });
    // const mesh = new THREE.Mesh(geometry, material);

    mesh.scale.x = 360
    mesh.scale.z = 360

    mesh.renderOrder = -1;

    // TODO: Textured look?
    mesh.material.colorNode = Fn(() => {
      // Remap v from Mercator space back to equirectangular
      // UV v (0→1) maps to Mercator y (-180→+180)
      const mercY = uv().y.mul(2.0).sub(1.0).mul(Math.PI); // -π to π
      const lat = float(2.0)
        .mul(mercY.exp().atan())
        .sub(Math.PI / 2); // inverse Mercator → latitude in radians
      const equirectV = lat.div(Math.PI).add(0.5); // latitude (-π/2→π/2) → v (0→1)

      const correctedUV = vec2(uv().x, equirectV);
      const color = texture(dayTexture, correctedUV).toVar();

      const luminance = color.r
        .mul(0.299)
        .add(color.g.mul(0.587))
        .add(color.b.mul(0.114));
      // Tint with a warm stone color
      const stone = vec3(0.48, 0.45, 0.42);
      return stone.mul(luminance).mul(38).saturate();
    })();

    mesh.material.opacityNode = Fn(() => {
      const alphaX = smoothstep(0.0, fadeX, uv().x).mul(
        smoothstep(0.0, fadeX, float(1.0).sub(uv().x)),
      );
      const alphaY = smoothstep(0.0, fadeY, uv().y).mul(
        smoothstep(0.0, fadeY, float(1.0).sub(uv().y)),
      );
      return alphaX.mul(alphaY);
    })();

    return { uniforms: { fadeX, fadeY } };
  }, [mesh]);

  return (
    <>
      <primitive
        object={mesh}
        rotation={[-Math.PI / 2, 0, 0]}
        // position={[0, -180, 179]}
        {...props}
      />
    </>
  );
};

export default WorldMap;
