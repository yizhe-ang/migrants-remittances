import { useRoomStore } from "@/store";
import { index } from "d3-array";
import { useMemo, useRef } from "react";
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
      sizeT: uniform(0),
      colorT: uniform(0),
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
    const sizesFrom = [];
    const sizesTo = [];
    const colorsFrom = [];
    const colorsTo = [];

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
        colorsFrom.push(colorDummy.r, colorDummy.g, colorDummy.b, 1);
        colorsTo.push(colorDummy.r, colorDummy.g, colorDummy.b, 1);
      } else {
        // If doesn't exist, don't render at all
        sizesFrom.push(0);

        colorsFrom.push(0, 0, 0, 1);
        colorsTo.push(0, 0, 0, 1);
      }
    }

    const colorsOg = new Float32Array(colorsFrom);
    const sizesOg = new Float32Array(sizesFrom);

    const positionsBuffer = instancedArray(new Float32Array(positions), "vec3");
    const sizesFromBuffer = instancedArray(
      new Float32Array(sizesFrom),
      "float",
    );
    const sizesToBuffer = instancedArray(new Float32Array(sizesTo), "float");
    const colorsFromBuffer = instancedArray(
      new Float32Array(colorsFrom),
      "vec3",
    );
    const colorsToBuffer = instancedArray(new Float32Array(colorsTo), "vec3");

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

      const colorFrom = colorsFromBuffer.element(instanceIndex);
      const colorTo = colorsToBuffer.element(instanceIndex);
      const dataColor = mix(colorFrom, colorTo, u.colorT);

      const hoveredColor = vec3(0, 0, 0);

      const fillColor = dataColor
        // .mul(isHovered.oneMinus())
        // .add(hoveredColor.mul(isHovered));

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

    return {
      mesh,
      u,
      buffers: {
        size: {
          og: sizesOg,
          from: sizesFromBuffer,
          to: sizesToBuffer,
        },
        color: {
          og: colorsOg,
          from: colorsFromBuffer,
          to: colorsToBuffer,
        },
      },
    };
  }, [countriesGeoSorted, dataIndex, remRadiusScale, remToColorScale]);

  useGpuPicking({
    positionNode: mesh?.material?.positionNode,
    instanceCount: countriesGeoSorted?.length,
    geometry: mesh?.geometry,
    dataRef: countriesGeoSortedRef,
    hoveredIdUniform: u?.hoveredId,
  });

  useInteractions({
    buffers,
    u,
    countryTypeToIndex,
  });

  return <>{mesh && <primitive object={mesh} {...props} />}</>;
};

export default Points;
