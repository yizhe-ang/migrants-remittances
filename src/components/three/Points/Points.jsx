import { useRoomStore } from "@/store";
import { index } from "d3-array";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Fn,
  instancedArray,
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
  fract,
  screenCoordinate,
  mod,
} from "three/tsl";
import * as THREE from "three/webgpu";
import { latToMercatorY } from "@/lib/utils";
import useInteractions from "./useInteractions";
import useGpuPicking from "./useGpuPicking";

const colorDummy = new THREE.Color();

const STRIPE_FREQUENCY = 0.08;
const STRIPE_THRESHOLD = 0.8;
const DOTS_SPACING = 12;
const DOTS_RADIUS = 0.35;

const Points = ({ ...props }) => {
  const countriesGeoSortedRef = useRef(null);

  const flowsByOrigin = useRoomStore((state) => state.flowsByOrigin);
  const flowsByDestination = useRoomStore((state) => state.flowsByDestination);
  const countriesGeo = useRoomStore((state) => state.countriesGeo);

  const remRadiusScale = useRoomStore((state) => state.remRadiusScale);
  const propGdpRadiusScale = useRoomStore((state) => state.propGdpRadiusScale);
  const remToColorScale = useRoomStore((state) => state.remToColorScale);
  const remFromColorScale = useRoomStore((state) => state.remFromColorScale);
  const incomeColorScale = useRoomStore((state) => state.incomeColorScale);
  const propGdpFromColorScale = useRoomStore(
    (state) => state.propGdpFromColorScale,
  );
  const propGdpToColorScale = useRoomStore(
    (state) => state.propGdpToColorScale,
  );

  const setPoints = useRoomStore((state) => state.setPoints);

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

  const countryTypeToIdx = useMemo(() => {
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

  const { mesh, u, sortBuffer, realCount, originalIndex, sortIndices, buffers } =
    useMemo(() => {
      if (
        !countriesGeoSorted ||
        !dataIndex ||
        !remRadiusScale ||
        !remToColorScale
      )
        return {};

      const u = {
        hoveredId: uniform(0),
        staggeredT: uniform(0),
        incomeColorT: uniform(0),
        stripesT: uniform(0), // 0 = off, 1 = stripes
        dotsT: uniform(0), // 0 = off, 1 = polka dots
      };

      const geometry = new THREE.PlaneGeometry(1, 1);

      const material = new THREE.MeshBasicNodeMaterial({
        transparent: true,
        depthWrite: false,
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

      const sizesOg = [];
      const sizesPropGdp = [];
      const colors = [];
      const colorsPropGdp = [];
      const colorsIncome = [];

      for (let i = 0; i < countriesGeoSorted.length; i++) {
        const c = countriesGeoSorted[i];

        // Compute mercator projection
        const mercatorY = latToMercatorY(c.latitude);

        positions.push(c.longitude, mercatorY, 0);

        const d = dataIndex.get(c.type).get(c.country);
        if (d) {
          sizesOg.push(remRadiusScale(d.sim_remittances_with));

          if (d.prop_of_gdp != null) {
            sizesPropGdp.push(propGdpRadiusScale(d.prop_of_gdp));
          } else {
            sizesPropGdp.push(0);
          }

          if (c.type === "origin") {
            colorDummy.setStyle(remToColorScale(d.sim_remittances_with));
          } else {
            colorDummy.setStyle(remFromColorScale(d.sim_remittances_with));
          }
          colors.push(colorDummy.r, colorDummy.g, colorDummy.b, 1);

          // NOTE: Account for missing / null values!
          if (d.prop_of_gdp === null) {
            colorDummy.setRGB(1, 1, 1);
          } else if (c.type === "origin") {
            const cssColor = propGdpToColorScale(d.prop_of_gdp);
            colorDummy.setStyle(cssColor);
          } else if (c.type === "destination") {
            const cssColor = propGdpFromColorScale(d.prop_of_gdp);
            colorDummy.setStyle(cssColor);
          }
          colorsPropGdp.push(colorDummy.r, colorDummy.g, colorDummy.b, 1);

          colorDummy.setStyle(incomeColorScale(d.income));
          colorsIncome.push(colorDummy.r, colorDummy.g, colorDummy.b, 1);
        } else {
          // If doesn't exist, don't render at all
          sizesOg.push(0);
          sizesPropGdp.push(0);

          colors.push(0, 0, 0, 1);
          colorsPropGdp.push(0, 0, 0, 1);
          colorsIncome.push(0, 0, 0, 1);
        }
      }

      const colorsOg = colors.slice();
      // const colorsOg = colorsPropGdp.slice();

      const realCount = countriesGeoSorted.length;

      const positionsBuffer = instancedArray(
        new Float32Array(positions),
        "vec3",
      );
      const sizeOgBuffer = instancedArray(new Float32Array(sizesOg), "float");
      const sizeBuffer = instancedArray(realCount, "float");
      // const sizeBuffer = instancedArray(new Float32Array(sizesOg), "float");
      const colorBuffer = instancedArray(new Float32Array(colors), "vec4");
      const colorIncomeBuffer = instancedArray(
        new Float32Array(colorsIncome),
        "vec4",
      );

      // Sort buffer: stores original data index for each draw position
      // Initialize with identity mapping, CPU sort in useFrame reorders these
      const sortKeys = new Uint32Array(realCount);
      for (let i = 0; i < realCount; i++) sortKeys[i] = i;
      const sortBuffer = instancedArray(sortKeys, "uint");

      // Indirection: look up original data index from sorted draw order
      const originalIndex = sortBuffer.element(instanceIndex);

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

        // const isHovered = originalIndex.add(1).equal(u.hoveredId).toFloat();

        const dataColor = mix(
          colorBuffer.element(originalIndex).xyz,
          colorIncomeBuffer.element(originalIndex).xyz,
          u.incomeColorT,
        );

        // const hoveredColor = vec3(0, 0, 0);

        const fillColor = dataColor;

        const strokeColor = vec3(0.1, 0.1, 0.1);

        // Diagonal stripe pattern (screen-space for uniform sizing)
        const sc = screenCoordinate;
        const diag = sc.x.add(sc.y).mul(float(STRIPE_FREQUENCY));
        const fw2 = fwidth(diag);
        const stripe = smoothstep(
          float(STRIPE_THRESHOLD).sub(fw2),
          float(STRIPE_THRESHOLD).add(fw2),
          fract(diag),
        );
        const stripeColor = mix(fillColor, vec3(1, 1, 1), stripe);

        // Polka dot pattern (screen-space)
        const cell = vec2(float(DOTS_SPACING), float(DOTS_SPACING));
        const cellPos = mod(sc.xy, cell).sub(cell.mul(0.5));
        const dotDist = cellPos.length().div(float(DOTS_SPACING));
        const fwDot = fwidth(dotDist);
        const dotMask = smoothstep(
          float(DOTS_RADIUS).add(fwDot),
          float(DOTS_RADIUS).sub(fwDot),
          dotDist,
        );
        const dotsColor = mix(fillColor, vec3(1, 1, 1), dotMask);

        // Mix between no pattern, stripes, and dots
        const patternColor = mix(
          mix(fillColor, stripeColor, u.stripesT),
          dotsColor,
          u.dotsT,
        );
        const color = patternColor.mul(fill).add(strokeColor.mul(stroke));

        return vec4(color, outer.mul(0.995));
      })();

      material.positionNode = Fn(() => {
        const offset = positionsBuffer.element(originalIndex);

        const threshold = float(originalIndex).div(float(realCount));
        const overlap = float(0.05);
        const instanceT = smoothstep(
          threshold.sub(overlap),
          threshold.add(overlap),
          u.staggeredT,
        );
        const size = mix(
          sizeBuffer.element(originalIndex),
          sizeOgBuffer.element(originalIndex),
          instanceT,
        );

        // Always same size
        const dist = cameraPosition.sub(offset).length();
        const scale = size.mul(dist).mul(0.01);

        return positionLocal.mul(scale).add(offset);
      })();

      // Pre-allocate for per-frame sort (avoids allocation every frame)
      const sortIndices = Array.from({ length: realCount }, (_, i) => i);

      return {
        mesh,
        u,
        sortBuffer,
        realCount,
        originalIndex,
        sortIndices,
        buffers: {
          size: {
            og: sizesOg,
            buffer: sizeBuffer.value,
            propGdp: sizesPropGdp,
          },
          color: {
            og: colorsOg,
            buffer: colorBuffer.value,
            income: colorsIncome,
            propGdp: colorsPropGdp,
          },
        },
      };
    }, [countriesGeoSorted, dataIndex, remRadiusScale, remToColorScale, propGdpRadiusScale, propGdpToColorScale, propGdpFromColorScale, remFromColorScale, incomeColorScale]);

  useEffect(() => {
    if (!u || !buffers || !countryTypeToIdx) return;

    setPoints({
      u,
      buffers,
      countryTypeToIdx,
    });
  }, [u, buffers]);

  // Per-frame: sort indices by current size buffer descending (largest first = drawn behind)
  useFrame(() => {
    if (!sortBuffer || !buffers || !sortIndices) return;

    const sizeArr = buffers.size.buffer.array;

    // Reset indices and sort (reuses pre-allocated array)
    for (let i = 0; i < realCount; i++) sortIndices[i] = i;
    sortIndices.sort((a, b) => sizeArr[b] - sizeArr[a]);

    const array = sortBuffer.value.array;
    for (let i = 0; i < realCount; i++) {
      array[i] = sortIndices[i];
    }
    sortBuffer.value.needsUpdate = true;
  }, -1); // priority -1 to run before picking/render

  useGpuPicking({
    positionNode: mesh?.material?.positionNode,
    originalIndex,
    instanceCount: countriesGeoSorted?.length,
    geometry: mesh?.geometry,
    dataRef: countriesGeoSortedRef,
    hoveredIdUniform: u?.hoveredId,
  });

  useInteractions({
    buffers,
    countryTypeToIdx,
  });

  return <>{mesh && <primitive object={mesh} {...props} />}</>;
};

export default Points;
