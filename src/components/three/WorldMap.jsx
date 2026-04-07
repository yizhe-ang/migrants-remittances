import { useTexture } from "@react-three/drei";
import { useEffect, useMemo } from "react";
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
import { useRoomStore } from "@/store";

// const BLEND_START = 0.08;
const BLEND_START = 0.2;
const VISIBILITY_EPSILON = 0.001;

const createMapColorNode = (dayTexture) =>
  Fn(() => {
    const mercY = uv().y.mul(2.0).sub(1.0).mul(Math.PI);
    const lat = float(2.0)
      .mul(mercY.exp().atan())
      .sub(Math.PI / 2);
    const equirectV = lat.div(Math.PI).add(0.5);

    const correctedUV = vec2(uv().x, equirectV);
    const color = texture(dayTexture, correctedUV).toVar();

    const luminance = color.r
      .mul(0.299)
      .add(color.g.mul(0.587))
      .add(color.b.mul(0.114));
    const stone = vec3(0.48, 0.45, 0.42);
    return stone.mul(luminance).mul(38).saturate();
  });

const createMapOpacityNode = (fadeX, fadeY, blendAlpha) =>
  Fn(() => {
    const alphaX = smoothstep(0.0, fadeX, uv().x).mul(
      smoothstep(0.0, fadeX, float(1.0).sub(uv().x)),
    );
    const alphaY = smoothstep(0.0, fadeY, uv().y).mul(
      smoothstep(0.0, fadeY, float(1.0).sub(uv().y)),
    );
    return alphaX.mul(alphaY).mul(blendAlpha);
  });

const WorldMap = ({ ...props }) => {
  const dayTexture = useTexture("/textures/earth/day.jpg");
  dayTexture.colorSpace = THREE.SRGBColorSpace;
  const setWorldMap = useRoomStore((state) => state.setWorldMap);

  const { mesh: verletMesh, u } = useVerletSystem();

  useEffect(() => {
    setWorldMap({
      u,
    });
  }, [u]);

  const { legacyMesh, legacyBlendUniform, verletBlendUniform } = useMemo(() => {
    const fadeX = uniform(0.15);
    const fadeY = uniform(0.15);
    const legacyBlend = uniform(1.0);
    const verletBlend = uniform(0.0);

    const legacyGeometry = new THREE.PlaneGeometry(360, 360);
    const legacyMaterial = new THREE.MeshBasicNodeMaterial({
      transparent: true,
    });
    const legacyMesh = new THREE.Mesh(legacyGeometry, legacyMaterial);

    legacyMesh.renderOrder = -2;
    legacyMaterial.colorNode = createMapColorNode(dayTexture)();
    legacyMaterial.opacityNode = createMapOpacityNode(
      fadeX,
      fadeY,
      legacyBlend,
    )();

    verletMesh.scale.set(360, 360, 360);
    verletMesh.renderOrder = -1;
    verletMesh.material.colorNode = createMapColorNode(dayTexture)();
    verletMesh.material.opacityNode = createMapOpacityNode(
      fadeX,
      fadeY,
      verletBlend,
    )();

    return {
      legacyMesh,
      legacyBlendUniform: legacyBlend,
      verletBlendUniform: verletBlend,
    };
  }, [dayTexture, verletMesh]);

  useEffect(() => {
    const blendAlpha = THREE.MathUtils.smoothstep(
      u.simulationMix.value,
      0,
      BLEND_START,
    );
    const legacyAlpha = 1 - blendAlpha;

    legacyBlendUniform.value = legacyAlpha;
    verletBlendUniform.value = blendAlpha;

    legacyMesh.visible = legacyAlpha > VISIBILITY_EPSILON;
    verletMesh.visible = blendAlpha > VISIBILITY_EPSILON;
  }, [legacyBlendUniform, legacyMesh, u, verletBlendUniform, verletMesh]);

  return (
    <group {...props}>
      <primitive object={legacyMesh} />
      <primitive object={verletMesh} />
    </group>
  );
};

export default WorldMap;
