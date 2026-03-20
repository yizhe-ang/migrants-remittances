import { useRoomStore } from "@/store";
import { index } from "d3-array";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
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
  step,
  fwidth,
  float,
  cameraPosition,
  uniform,
  mix,
  fract,
  screenCoordinate,
  mod,
  floor,
} from "three/tsl";
import * as THREE from "three/webgpu";
import { latToMercatorY } from "@/lib/utils";
import useInteractions from "./useInteractions";
import useGpuPicking from "./useGpuPicking";

const colorDummy = new THREE.Color();

// Immer (used by @sqlrooms/room-store) deep-freezes the entire Zustand state tree.
// Wrapping in a class prevents Immer from freezing mutable GPU buffers/uniforms.
class PointsHandle {
  constructor({ u, buffers, countryTypeToIdx, dataIndex }) {
    this.u = u;
    this.buffers = buffers;
    this.countryTypeToIdx = countryTypeToIdx;
    this.dataIndex = dataIndex;
  }
}

const STRIPE_FREQUENCY = 0.05;
const STRIPE_THRESHOLD = 0.7;
const DOTS_SPACING = 10;
const DOTS_RADIUS = 0.3;

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

  const selectedYear = useRoomStore((state) => state.selectedYear);

  const setPoints = useRoomStore((state) => state.setPoints);

  // Year-reactive data index for tooltips and external consumers
  const dataIndex = useMemo(() => {
    if (!flowsByOrigin || !flowsByDestination) return null;

    const originData = flowsByOrigin.filter((d) => d.year === selectedYear);
    const originIndex = index(originData, (d) => d.origin);

    const destinationData = flowsByDestination.filter(
      (d) => d.year === selectedYear,
    );
    const destinationIndex = index(destinationData, (d) => d.destination);

    return new Map([
      ["origin", originIndex],
      ["destination", destinationIndex],
    ]);
  }, [flowsByOrigin, flowsByDestination, selectedYear]);

  // Stable ordering — no data dependency. useFrame handles visual depth sorting via sortBuffer.
  const countriesGeoSorted = useMemo(() => {
    if (!countriesGeo) return null;

    const countriesGeoOrigin = countriesGeo.map((d) => ({
      ...d,
      type: `origin`,
    }));
    const countriesGeoDestination = countriesGeo.map((d) => ({
      ...d,
      type: `destination`,
    }));

    return [...countriesGeoOrigin, ...countriesGeoDestination];
  }, [countriesGeo]);

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

  const {
    mesh,
    u,
    sortBuffer,
    realCount,
    originalIndex,
    sortIndices,
    buffers,
  } = useMemo(() => {
    if (!countriesGeoSorted) return {};

    const u = {
      hoveredId: uniform(0),
      staggeredT: uniform(0),
      incomeColorT: uniform(0),
      stripesT: uniform(0), // 0 = off, 1 = stripes
      dotsT: uniform(0), // 0 = off, 1 = polka dots
      opacity: uniform(1),
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

    // Init positions (stable — only depends on countriesGeo)
    const positions = [];
    const opacities = [];

    for (let i = 0; i < countriesGeoSorted.length; i++) {
      const c = countriesGeoSorted[i];

      // Compute mercator projection
      const mercatorY = latToMercatorY(c.latitude);

      positions.push(c.longitude, mercatorY, 0);

      opacities.push(1);
    }

    const realCount = countriesGeoSorted.length;

    // Size/color buffers initialized with zeros — filled by useLayoutEffect
    const sizesOg = new Array(realCount).fill(0);
    const sizesPropGdp = new Array(realCount).fill(0);
    const colorsOg = new Array(realCount * 4).fill(0);
    // const colorsOg = colorsPropGdp.slice();
    const colorsPropGdp = new Array(realCount * 4).fill(0);
    const colorsIncome = new Array(realCount * 4).fill(0);

    const positionsBuffer = instancedArray(new Float32Array(positions), "vec3");
    const sizeOgBuffer = instancedArray(new Float32Array(sizesOg), "float");
    const sizeBuffer = instancedArray(realCount, "float");
    // const sizeBuffer = instancedArray(new Float32Array(sizesOg), "float");
    const colorBuffer = instancedArray(new Float32Array(colorsOg), "vec4");
    const colorIncomeBuffer = instancedArray(
      new Float32Array(colorsIncome),
      "vec4",
    );
    const opacityBuffer = instancedArray(new Float32Array(opacities), "float");
    const typeBuffer = instancedArray(realCount, "float");

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

      const strokeColor = vec3(0.2);
      // const strokeColor = vec3(1.0);

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
      // Checkerboard: skip every other cell so dots have alternating gaps
      const col = floor(sc.x.div(float(DOTS_SPACING)));
      const row = floor(sc.y.div(float(DOTS_SPACING)));
      const checker = mod(col.add(row), float(2));
      const dotMask = smoothstep(
        float(DOTS_RADIUS).add(fwDot),
        float(DOTS_RADIUS).sub(fwDot),
        dotDist,
      ).mul(checker);
      const dotsColor = mix(fillColor, vec3(1, 1, 1), dotMask);

      // Per-point pattern: type 0 = stripes (destination), type 1 = dots (origin)
      const pointType = typeBuffer.element(originalIndex);
      const patternColor = mix(stripeColor, dotsColor, pointType);
      const color = patternColor.mul(fill).add(strokeColor.mul(stroke));

      const opacity = opacityBuffer.element(originalIndex);

      return vec4(color, outer.mul(0.995).mul(opacity).mul(u.opacity));
      // return vec4(color, outer.mul(1).mul(opacity).mul(u.opacity));
    })();

    material.positionNode = Fn(() => {
      const offset = positionsBuffer.element(originalIndex);

      const threshold = float(originalIndex).div(float(realCount));
      const overlap = float(0.05);
      const instanceT = smoothstep(
        threshold.sub(overlap),
        threshold.add(overlap),
        u.staggeredT,
      ).mul(step(float(0.001), u.staggeredT));
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
          ogBuffer: sizeOgBuffer.value,
          buffer: sizeBuffer.value,
          propGdp: sizesPropGdp,
        },
        color: {
          og: colorsOg,
          buffer: colorBuffer.value,
          incomeBuffer: colorIncomeBuffer.value,
          income: colorsIncome,
          propGdp: colorsPropGdp,
        },
        opacity: {
          buffer: opacityBuffer.value,
        },
        type: {
          buffer: typeBuffer.value,
        },
      },
    };
  }, [countriesGeoSorted]);

  // Imperatively update size/color buffers when selectedYear changes
  useLayoutEffect(() => {
    // useEffect(() => {
    if (
      !dataIndex ||
      !countriesGeoSorted ||
      !buffers ||
      !remRadiusScale ||
      !remToColorScale ||
      !remFromColorScale ||
      !propGdpRadiusScale ||
      !propGdpToColorScale ||
      !propGdpFromColorScale ||
      !incomeColorScale
    )
      return;

    for (let i = 0; i < countriesGeoSorted.length; i++) {
      const c = countriesGeoSorted[i];
      const d = dataIndex.get(c.type).get(c.country);

      buffers.type.buffer.array[i] = c.type === "destination" ? 0 : 1;

      if (d) {
        buffers.size.og[i] = remRadiusScale(d.sim_remittances_with);

        if (d.prop_of_gdp != null) {
          buffers.size.propGdp[i] = propGdpRadiusScale(d.prop_of_gdp);
        } else {
          buffers.size.propGdp[i] = 0;
        }

        if (c.type === "origin") {
          colorDummy.setStyle(remToColorScale(d.sim_remittances_with));
        } else {
          colorDummy.setStyle(remFromColorScale(d.sim_remittances_with));
        }
        buffers.color.og[i * 4] = colorDummy.r;
        buffers.color.og[i * 4 + 1] = colorDummy.g;
        buffers.color.og[i * 4 + 2] = colorDummy.b;
        buffers.color.og[i * 4 + 3] = 1;

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
        buffers.color.propGdp[i * 4] = colorDummy.r;
        buffers.color.propGdp[i * 4 + 1] = colorDummy.g;
        buffers.color.propGdp[i * 4 + 2] = colorDummy.b;
        buffers.color.propGdp[i * 4 + 3] = 1;

        colorDummy.setStyle(incomeColorScale(d.income));
        buffers.color.income[i * 4] = colorDummy.r;
        buffers.color.income[i * 4 + 1] = colorDummy.g;
        buffers.color.income[i * 4 + 2] = colorDummy.b;
        buffers.color.income[i * 4 + 3] = 1;
      } else {
        // If doesn't exist, don't render at all
        buffers.size.og[i] = 0;
        buffers.size.propGdp[i] = 0;

        buffers.color.og[i * 4] = 0;
        buffers.color.og[i * 4 + 1] = 0;
        buffers.color.og[i * 4 + 2] = 0;
        buffers.color.og[i * 4 + 3] = 1;
        buffers.color.propGdp[i * 4] = 0;
        buffers.color.propGdp[i * 4 + 1] = 0;
        buffers.color.propGdp[i * 4 + 2] = 0;
        buffers.color.propGdp[i * 4 + 3] = 1;
        buffers.color.income[i * 4] = 0;
        buffers.color.income[i * 4 + 1] = 0;
        buffers.color.income[i * 4 + 2] = 0;
        buffers.color.income[i * 4 + 3] = 1;
      }
    }

    buffers.type.buffer.needsUpdate = true;

    // Immediately update ogBuffer (stagger target used in shader)
    const sizeOgArr = buffers.size.ogBuffer.array;
    for (let i = 0; i < countriesGeoSorted.length; i++) {
      sizeOgArr[i] = buffers.size.og[i];
    }
    buffers.size.ogBuffer.needsUpdate = true;

    // Immediately update incomeBuffer (blended via uniform, not per-point animated)
    const incomeArr = buffers.color.incomeBuffer.array;
    for (let i = 0; i < countriesGeoSorted.length * 4; i++) {
      incomeArr[i] = buffers.color.income[i];
    }
    buffers.color.incomeBuffer.needsUpdate = true;

    // Initialize color display buffer with computed colors
    const colorArr = buffers.color.buffer.array;
    for (let i = 0; i < countriesGeoSorted.length * 4; i++) {
      colorArr[i] = buffers.color.og[i];
    }
    buffers.color.buffer.needsUpdate = true;

    // GPU display buffers (size.buffer, color.buffer) are animated by useInteractions
  }, [
    dataIndex,
    countriesGeoSorted,
    buffers,
    remRadiusScale,
    remToColorScale,
    remFromColorScale,
    propGdpRadiusScale,
    propGdpToColorScale,
    propGdpFromColorScale,
    incomeColorScale,
  ]);

  useEffect(() => {
    if (!u || !buffers || !countryTypeToIdx || !dataIndex) return;

    setPoints(new PointsHandle({ u, buffers, countryTypeToIdx, dataIndex }));
  }, [u, buffers, countryTypeToIdx, dataIndex]);

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
    u,
    buffers,
    countryTypeToIdx,
    dataIndex,
  });

  return <>{mesh && <primitive object={mesh} {...props} />}</>;
};

export default Points;
