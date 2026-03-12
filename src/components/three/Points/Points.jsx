import { useRoomStore } from "@/store";
import { useFrame, useThree } from "@react-three/fiber";
import { index } from "d3-array";
import { useEffect, useMemo, useRef } from "react";
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
  mix,
} from "three/tsl";
import * as THREE from "three/webgpu";
import { latToMercatorY } from "@/lib/utils";
import useInteractions from "./useInteractions";

const colorDummy = new THREE.Color();

const Points = ({ ...props }) => {
  const pickedId = useRef(0);
  const prevPickedId = useRef(0);
  const countriesGeoSortedRef = useRef(null);

  const flowsByOrigin = useRoomStore((state) => state.flowsByOrigin);
  const flowsByDestination = useRoomStore((state) => state.flowsByDestination);
  const countriesGeo = useRoomStore((state) => state.countriesGeo);

  const remRadiusScale = useRoomStore((state) => state.remRadiusScale);
  const remToColorScale = useRoomStore((state) => state.remToColorScale);
  const remFromColorScale = useRoomStore((state) => state.remFromColorScale);

  const dataIndex = useMemo(() => {
    if (!flowsByOrigin || !flowsByDestination) return null;

    const originData = flowsByOrigin.filter((d) => d.year === 2019);
    const originIndex = index(originData, (d) => d.origin);

    const destinationData = flowsByDestination.filter((d) => d.year === 2019);
    const destinationIndex = index(destinationData, (d) => d.destination);

    return new Map([
      ["origin", originIndex],
      ["destination", destinationIndex],
    ]);
  }, [flowsByOrigin, flowsByDestination]);

  const setHoveredCountry = useRoomStore((state) => state.setHoveredCountry);
  const setSelectedCountry = useRoomStore((state) => state.setSelectedCountry);
  const setMousePosition = useRoomStore((state) => state.setMousePosition);

  const countriesGeoSorted = useMemo(() => {
    if (!countriesGeo || !dataIndex) return null;

    const countriesGeoOrigin = countriesGeo.map((d) => ({
      ...d,
      type: `origin`,
    }));
    const countriesGeoDestination = countriesGeo.map((d) => ({
      ...d,
      type: `destination`,
    }));
    const countriesGeoProcessed = [
      ...countriesGeoOrigin,
      ...countriesGeoDestination,
    ];

    // Sort for depth buffer
    // const countriesGeoSorted = [...countriesGeoProcessed].sort((a, b) => {
    const countriesGeoSorted = countriesGeoProcessed.sort((a, b) => {
      if (!dataIndex.get(b.type).has(b.country)) return 1;
      if (!dataIndex.get(a.type).has(a.country)) return -1;

      return (
        dataIndex.get(b.type).get(b.country).sim_remittances_with -
        dataIndex.get(a.type).get(a.country).sim_remittances_with
      );
    });

    return countriesGeoSorted;
  }, [countriesGeo, dataIndex]);

  const countryTypeToIndex = useMemo(() => {
    if (!countriesGeoSorted) return null;

    const map = new Map([
      ["origin", new Map()],
      ["destination", new Map()],
    ]);

    countriesGeoSorted.forEach((d, i) => {
      map.get(d.type).set(d.country, i);
    });

    return map;
  }, [countriesGeoSorted]);

  // Keep ref in sync for use in useFrame/click handlers
  countriesGeoSortedRef.current = countriesGeoSorted;

  const { mesh, pickingTexture, pickingScene, u, buffers } = useMemo(() => {
    if (
      !countriesGeoSorted ||
      !dataIndex ||
      !remRadiusScale ||
      !remToColorScale
    )
      return {};

    const u = {
      hoveredId: uniform(0),
      sizeT: uniform(0),
    };

    const geometry = new THREE.PlaneGeometry(1, 1);

    // const material = new THREE.MeshPhysicalNodeMaterial({
    //   roughness: 0.5,
    //   metalness: 0.5,
    //   transparent: true,
    // });
    const material = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
      // depthTest: false,
    });

    const mesh = new THREE.InstancedMesh(
      geometry,
      material,
      countriesGeoSorted.length,
    );
    mesh.frustumCulled = false;
    mesh.renderOrder = 1;

    // Init buffers / attributes
    const positions = [];
    const sizesFrom = [];
    const sizesTo = [];
    const colors = [];

    const pickingColors = [];

    for (let i = 0; i < countriesGeoSorted.length; i++) {
      const c = countriesGeoSorted[i];

      // Compute mercator projection
      const mercatorY = latToMercatorY(c.latitude);

      positions.push(c.longitude, mercatorY, 0);

      sizesTo.push(0);

      const d = dataIndex.get(c.type).get(c.country);
      if (d) {
        sizesFrom.push(remRadiusScale(d.sim_remittances_with));

        if (c.type === "origin") {
          colorDummy.setStyle(remToColorScale(d.sim_remittances_with));
        } else {
          colorDummy.setStyle(remFromColorScale(d.sim_remittances_with));
        }
        colors.push(colorDummy.r, colorDummy.g, colorDummy.b);
      } else {
        // If doesn't exist, don't render at all
        sizesFrom.push(0);

        colors.push(0, 0, 0);
      }

      // GPU picking colors
      colorDummy.setHex(i + 1, THREE.NoColorSpace);
      pickingColors.push(colorDummy.r, colorDummy.g, colorDummy.b);
    }

    const sizesOg = new Float32Array(sizesFrom);

    const positionsBuffer = instancedArray(new Float32Array(positions), "vec3");
    const sizesFromBuffer = instancedArray(
      new Float32Array(sizesFrom),
      "float",
    );
    const sizesToBuffer = instancedArray(new Float32Array(sizesTo), "float");
    const colorsBuffer = instancedArray(new Float32Array(colors), "vec3");

    const pickingColorsAttribute = instancedBufferAttribute(
      new THREE.InstancedBufferAttribute(new Float32Array(pickingColors), 3),
    );

    material.colorNode = Fn(() => {
      const distUV = uv().sub(vec2(0.5, 0.5)).length();

      const fw = fwidth(distUV);
      const strokePx = float(1.5); // stroke width in pixels
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

      const strokeColor = vec3(0.1, 0.1, 0.1);

      const color = fillColor.mul(fill).add(strokeColor.mul(stroke));

      return vec4(color, outer.mul(0.995));
    })();

    material.positionNode = Fn(() => {
      const offset = positionsBuffer.element(instanceIndex);

      const sizeFrom = sizesFromBuffer.element(instanceIndex);
      const sizeTo = sizesToBuffer.element(instanceIndex);
      const size = mix(sizeFrom, sizeTo, u.sizeT);

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
      depthWrite: false,
    });
    pickingMaterial.colorNode = pickingColorsAttribute;
    pickingMaterial.positionNode = material.positionNode;

    const pickingMesh = new THREE.InstancedMesh(
      geometry,
      pickingMaterial,
      countriesGeoSorted.length,
    );
    pickingMesh.frustumCulled = false;

    const pickingScene = new THREE.Scene();
    const pickingTexture = new THREE.RenderTarget(1, 1);
    pickingScene.add(pickingMesh);

    return {
      mesh,
      u,
      pickingTexture,
      pickingScene,
      buffers: {
        size: {
          og: sizesOg,
          from: sizesFromBuffer,
          to: sizesToBuffer,
        },
      },
    };
  }, [countriesGeoSorted, dataIndex, remRadiusScale, remToColorScale]);

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

        // Update store only when pickedId changes
        if (pickedId.current !== prevPickedId.current) {
          prevPickedId.current = pickedId.current;

          if (pickedId.current > 0 && countriesGeoSortedRef.current) {
            const entry = countriesGeoSortedRef.current[pickedId.current - 1];
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
      if (pickedId.current > 0 && countriesGeoSortedRef.current) {
        const entry = countriesGeoSortedRef.current[pickedId.current - 1];
        if (entry) {
          setSelectedCountry({ country: entry.country, type: entry.type });

          console.log(entry);
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

  useInteractions({
    buffers,
    u,
    countryTypeToIndex,
  });

  return <>{mesh && <primitive object={mesh} {...props} />}</>;
};

export default Points;
