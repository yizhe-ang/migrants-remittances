import { useRoomStore } from "@/store";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
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
  uniform,
} from "three/tsl";
import * as THREE from "three/webgpu";

const colorDummy = new THREE.Color();

const Points = ({ ...props }) => {
  const pickedId = useRef(0);

  const flowsByOrigin = useRoomStore((state) => state.flowsByOrigin);
  const countriesGeo = useRoomStore((state) => state.countriesGeo);

  const data = useMemo(() => {
    if (!flowsByOrigin) return null;

    return flowsByOrigin.filter((d) => d.year === 2019);
  }, [flowsByOrigin]);

  const { mesh, pickingTexture, pickingScene, u } = useMemo(() => {
    if (!countriesGeo) return {};

    const u = {
      hoveredId: uniform(0),
    };

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

    const pickingColors = [];

    for (let i = 0; i < countriesGeo.length; i++) {
      const c = countriesGeo[i];

      positions.push(c.longitude, c.latitude, 0);

      colorDummy.setHex(i + 1, THREE.NoColorSpace);
      pickingColors.push(colorDummy.r, colorDummy.g, colorDummy.b);

      sizes.push(Math.random() * 3);
    }

    const positionsBuffer = instancedArray(new Float32Array(positions), "vec3");
    const sizesBuffer = instancedArray(new Float32Array(sizes), "float");

    const pickingColorsAttribute = instancedBufferAttribute(
      new THREE.InstancedBufferAttribute(new Float32Array(pickingColors), 3),
    );

    material.colorNode = Fn(() => {
      const distUV = uv().sub(vec2(0.5, 0.5)).length();
      const edge = smoothstep(0.48, 0.5, distUV).oneMinus();

      const isHovered = instanceIndex.add(1).equal(u.hoveredId).toFloat()
      const color = vec3(1, 0, 0).mix(vec3(0, 1, 0), isHovered);

      return vec4(color, edge);
    })();

    material.positionNode = Fn(() => {
      const offset = positionsBuffer.element(instanceIndex);
      const size = sizesBuffer.element(instanceIndex);

      // Always same size
      const dist = cameraPosition.sub(offset).length();
      const scale = size.mul(dist).mul(0.01);

      return positionLocal.mul(scale).add(offset);
    })();

    // Picking mesh
    const pickingMaterial = new THREE.MeshBasicNodeMaterial({
      blending: THREE.NormalBlending,
      depthWrite: true,
    });
    pickingMaterial.colorNode = pickingColorsAttribute;
    pickingMaterial.positionNode = material.positionNode;

    const pickingMesh = new THREE.InstancedMesh(
      geometry,
      pickingMaterial,
      countriesGeo.length,
    );
    pickingMesh.frustumCulled = false;

    const pickingScene = new THREE.Scene();
    const pickingTexture = new THREE.RenderTarget(1, 1);
    pickingScene.add(pickingMesh);

    return { mesh, u, pickingTexture, pickingScene };
  }, [countriesGeo]);

  useFrame(({ gl, pointer, camera, size }) => {
    if (!pickingTexture || !pickingScene) return;

    const mouseX = ((pointer.x + 1) / 2) * size.width;
    const mouseY = ((1 - pointer.y) / 2) * size.height;

    // GPU PICKING #############################################################
    const pixelRatio = gl.getPixelRatio();

    camera.setViewOffset(
      gl.domElement.width,
      gl.domElement.height,
      Math.floor(mouseX * pixelRatio),
      Math.floor(mouseY * pixelRatio),
      1,
      1,
    );

    gl.setRenderTarget(pickingTexture);
    gl.render(pickingScene, camera);
    gl.setRenderTarget(null);
    camera.clearViewOffset();
    gl.readRenderTargetPixelsAsync(pickingTexture, 0, 0, 1, 1, 0).then(
      (pixelBuffer) => {
        pickedId.current =
          (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | pixelBuffer[2];

        u.hoveredId.value = pickedId.current;
      },
    );
  });

  return <>{mesh && <primitive object={mesh} {...props} />}</>;
};

export default Points;
