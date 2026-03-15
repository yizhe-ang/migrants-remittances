import { useRoomStore } from "@/store";
import { index } from "d3-array";
import { useEffect, useMemo, useRef } from "react";
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
} from "three/tsl";
import * as THREE from "three/webgpu";
import { latToMercatorY } from "@/lib/utils";
import useInteractions from "./useInteractions";
import useGpuPicking from "./useGpuPicking";

const colorDummy = new THREE.Color();

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

  const { mesh, u, buffers } = useMemo(() => {
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
      sizePropGdpT: uniform(0),
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
    const colorsIncome = [];

    for (let i = 0; i < countriesGeoSorted.length; i++) {
      const c = countriesGeoSorted[i];

      // Compute mercator projection
      const mercatorY = latToMercatorY(c.latitude);

      positions.push(c.longitude, mercatorY, 0);

      const d = dataIndex.get(c.type).get(c.country);
      if (d) {
        sizesOg.push(remRadiusScale(d.sim_remittances_with));

        if (d.prop_of_gdp) {
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

        colorDummy.setStyle(incomeColorScale(d.income));
        colorsIncome.push(colorDummy.r, colorDummy.g, colorDummy.b, 1);
      } else {
        // If doesn't exist, don't render at all
        sizesOg.push(0);
        sizesPropGdp.push(0);

        colors.push(0, 0, 0, 1);
        colorsIncome.push(0, 0, 0, 1);
      }
    }

    const colorsOg = new Float32Array(colors);

    const positionsBuffer = instancedArray(new Float32Array(positions), "vec3");
    const sizeOgBuffer = instancedArray(new Float32Array(sizesOg), "float");
    const sizeBuffer = instancedArray(countriesGeoSorted.length, "float");
    const sizePropGdpBuffer = instancedArray(
      new Float32Array(sizesPropGdp),
      "float",
    );
    const colorBuffer = instancedArray(new Float32Array(colors), "vec4");
    const colorIncomeBuffer = instancedArray(
      new Float32Array(colorsIncome),
      "vec4",
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

      // const dataColor = colorBuffer.element(instanceIndex).xyz;
      const dataColor = mix(
        colorBuffer.element(instanceIndex).xyz,
        colorIncomeBuffer.element(instanceIndex).xyz,
        u.incomeColorT,
      );

      const hoveredColor = vec3(0, 0, 0);

      const fillColor = dataColor;
      // .mul(isHovered.oneMinus())
      // .add(hoveredColor.mul(isHovered));

      const strokeColor = vec3(0.1, 0.1, 0.1);

      const color = fillColor.mul(fill).add(strokeColor.mul(stroke));

      return vec4(color, outer.mul(0.995));
    })();

    material.positionNode = Fn(() => {
      const offset = positionsBuffer.element(instanceIndex);

      const threshold = float(instanceIndex).div(
        float(countriesGeoSorted.length),
      );
      const overlap = float(0.05);
      const instanceT = smoothstep(
        threshold.sub(overlap),
        threshold.add(overlap),
        u.staggeredT,
      );
      const size = mix(
        sizeBuffer.element(instanceIndex),
        sizeOgBuffer.element(instanceIndex),
        instanceT,
      );
      const sizeFinal = mix(
        size,
        sizePropGdpBuffer.element(instanceIndex),
        u.sizePropGdpT,
      );

      // Always same size
      const dist = cameraPosition.sub(offset).length();
      const scale = sizeFinal.mul(dist).mul(0.01);

      return positionLocal.mul(scale).add(offset);
    })();

    return {
      mesh,
      u,
      buffers: {
        size: { og: sizesOg, buffer: sizeBuffer.value, propGdp: sizesPropGdp },
        color: {
          og: colorsOg,
          buffer: colorBuffer.value,
          income: colorsIncome,
        },
      },
    };
  }, [countriesGeoSorted, dataIndex, remRadiusScale, remToColorScale]);

  useEffect(() => {
    if (!u || !buffers || !countryTypeToIdx) return;

    setPoints({
      u,
      buffers,
      countryTypeToIdx,
    });
  }, [u, buffers]);

  useGpuPicking({
    positionNode: mesh?.material?.positionNode,
    instanceCount: countriesGeoSorted?.length,
    geometry: mesh?.geometry,
    dataRef: countriesGeoSortedRef,
    hoveredIdUniform: u?.hoveredId,
  });

  useInteractions({
    buffers,
    countryTypeToIndex: countryTypeToIdx,
  });

  return <>{mesh && <primitive object={mesh} {...props} />}</>;
};

export default Points;
