import { useRoomStore } from "@/store";
import { useFrame } from "@react-three/fiber";
import { index } from "d3-array";
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
  fwidth,
  float,
  cameraPosition,
  uniform,
} from "three/tsl";
import * as THREE from "three/webgpu";

const colorDummy = new THREE.Color();

const Points = ({ ...props }) => {
  const pickedId = useRef(0);

  const flowsByOrigin = useRoomStore((state) => state.flowsByOrigin);
  const flowsByDestination = useRoomStore((state) => state.flowsByDestination);
  const countriesGeo = useRoomStore((state) => state.countriesGeo);

  const remRadiusScale = useRoomStore((state) => state.remRadiusScale);
  const remToColorScale = useRoomStore((state) => state.remToColorScale);
  const remFromColorScale = useRoomStore((state) => state.remFromColorScale);

  const dataIndex = useMemo(() => {
    if (!flowsByOrigin) return null;

    const data = flowsByOrigin.filter((d) => d.year === 2019);

    return index(data, (d) => d.origin);
  }, [flowsByOrigin]);

  const { mesh, pickingTexture, pickingScene, u } = useMemo(() => {
    if (!countriesGeo || !dataIndex || !remRadiusScale || !remToColorScale)
      return {};

    const u = {
      hoveredId: uniform(0),
    };

    const geometry = new THREE.PlaneGeometry(1, 1);

    // const material = new THREE.MeshPhysicalNodeMaterial({
    //   roughness: 0.5,
    //   metalness: 0.5,
    //   transparent: true,
    // });
    const material = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      // alphaTest: 0.5,
      depthWrite: false,
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
    const colors = [];

    const pickingColors = [];

    // Sort for depth buffer
    const countriesGeoSorted = [...countriesGeo].sort((a, b) => {
      if (!dataIndex.has(b.country)) return 1;
      if (!dataIndex.has(a.country)) return -1;

      return (
        dataIndex.get(b.country).sim_remittances_with -
        dataIndex.get(a.country).sim_remittances_with
      );
    });

    for (let i = 0; i < countriesGeo.length; i++) {
      const c = countriesGeoSorted[i];

      positions.push(c.longitude, c.latitude, 0);

      const d = dataIndex.get(c.country);
      if (d) {
        sizes.push(remRadiusScale(d.sim_remittances_with));

        colorDummy.setStyle(remToColorScale(d.sim_remittances_with));
        colors.push(colorDummy.r, colorDummy.g, colorDummy.b);
      } else {
        // If doesn't exist, don't render at all
        sizes.push(0);

        colors.push(0, 0, 0);
      }

      // GPU picking
      colorDummy.setHex(i + 1, THREE.NoColorSpace);
      pickingColors.push(colorDummy.r, colorDummy.g, colorDummy.b);
    }

    const positionsBuffer = instancedArray(new Float32Array(positions), "vec3");
    const sizesBuffer = instancedArray(new Float32Array(sizes), "float");
    const colorsBuffer = instancedArray(new Float32Array(colors), "vec3");

    const pickingColorsAttribute = instancedBufferAttribute(
      new THREE.InstancedBufferAttribute(new Float32Array(pickingColors), 3),
    );

    material.colorNode = Fn(() => {
      const distUV = uv().sub(vec2(0.5, 0.5)).length();

      const fw = fwidth(distUV);
      const strokePx = float(2.0); // stroke width in pixels
      const strokeWidth = fw.mul(strokePx);

      // Outer edge with 1px AA
      const outer = smoothstep(float(0.5), float(0.5).sub(fw), distUV);
      // Inner edge of stroke
      const innerEdge = float(0.5).sub(strokeWidth);
      const inner = smoothstep(innerEdge.sub(fw), innerEdge, distUV);

      const stroke = outer.mul(inner);
      const fill = outer.mul(inner.oneMinus());

      const isHovered = instanceIndex.add(1).equal(u.hoveredId).toFloat();

      const dataColor = colorsBuffer.element(instanceIndex);
      const hoveredColor = vec3(0, 0, 0);

      const fillColor = dataColor
        .mul(isHovered.oneMinus())
        .add(hoveredColor.mul(isHovered));

      const strokeColor = vec3(0, 0, 0);

      const color = fillColor.mul(fill).add(strokeColor.mul(stroke));

      return vec4(color, outer);
    })();

    material.positionNode = Fn(() => {
      const offset = positionsBuffer.element(instanceIndex);
      const size = sizesBuffer.element(instanceIndex);

      // Always same size
      const dist = cameraPosition.sub(offset).length();
      const scale = size.mul(dist).mul(0.01);

      // Push smaller points forward so they render on top of larger ones
      // const zOffset = size.negate().mul(0.7).add(float(instanceIndex).mul(-0.0001));

      // return positionLocal.mul(scale).add(offset).add(vec3(0, 0, zOffset));
      return positionLocal.mul(scale).add(offset);
    })();

    // Picking mesh
    const pickingMaterial = new THREE.MeshBasicNodeMaterial({
      // blending: THREE.NormalBlending,
      // depthWrite: true,
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
  }, [countriesGeo, dataIndex, remRadiusScale, remToColorScale]);

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
