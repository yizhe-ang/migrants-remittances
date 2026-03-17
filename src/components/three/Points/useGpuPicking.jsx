import { useRoomStore } from "@/store";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { instancedArray } from "three/tsl";
import * as THREE from "three/webgpu";

const colorDummy = new THREE.Color();

export default function useGpuPicking({
  positionNode,
  originalIndex,
  instanceCount,
  geometry,
  dataRef,
  hoveredIdUniform,
}) {
  const pickedId = useRef(0);
  const prevPickedId = useRef(0);

  const setHoveredCountry = useRoomStore((state) => state.setHoveredCountry);
  const setSelectedCountry = useRoomStore((state) => state.setSelectedCountry);
  const setMousePosition = useRoomStore((state) => state.setMousePosition);

  const { pickingScene, pickingTexture } = useMemo(() => {
    if (!positionNode || !instanceCount || !geometry || !originalIndex) return {};

    const pickingColors = [];
    for (let i = 0; i < instanceCount; i++) {
      colorDummy.setHex(i + 1, THREE.NoColorSpace);
      pickingColors.push(colorDummy.r, colorDummy.g, colorDummy.b);
    }

    const pickingColorsBuffer = instancedArray(
      new Float32Array(pickingColors),
      "vec3",
    );

    const pickingMaterial = new THREE.MeshBasicNodeMaterial({
      depthWrite: false,
    });
    // Use originalIndex indirection so picked ID maps to original data index
    pickingMaterial.colorNode = pickingColorsBuffer.element(originalIndex);
    pickingMaterial.positionNode = positionNode;

    const pickingMesh = new THREE.InstancedMesh(
      geometry,
      pickingMaterial,
      instanceCount,
    );
    pickingMesh.frustumCulled = false;

    const pickingScene = new THREE.Scene();
    const pickingTexture = new THREE.RenderTarget(1, 1);
    pickingScene.add(pickingMesh);

    return { pickingScene, pickingTexture };
  }, [positionNode, originalIndex, instanceCount, geometry]);

  useFrame(({ gl, pointer, camera, size }) => {
    if (!pickingTexture || !pickingScene) return;

    const mouseX = ((pointer.x + 1) / 2) * size.width;
    const mouseY = ((1 - pointer.y) / 2) * size.height;

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

        hoveredIdUniform.value = pickedId.current;

        if (pickedId.current !== prevPickedId.current) {
          prevPickedId.current = pickedId.current;

          if (pickedId.current > 0 && dataRef.current) {
            const entry = dataRef.current[pickedId.current - 1];
            if (entry) {
              setHoveredCountry({ country: entry.country, type: entry.type });
            }
          } else {
            setHoveredCountry(null);
          }
        }
      },
    );
  });

  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleClick = () => {
      if (pickedId.current > 0 && dataRef.current) {
        const entry = dataRef.current[pickedId.current - 1];
        if (entry) {
          setSelectedCountry({ country: entry.country, type: entry.type });
          // console.log(entry);
          return;
        }
      }
      setSelectedCountry(null);
    };

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMouseMove);
    return () => {
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [gl, setSelectedCountry, setMousePosition]);
}
