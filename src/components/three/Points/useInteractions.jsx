import { useRoomStore } from "@/store";
import { animate } from "motion";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three/webgpu";

const colorDummy = new THREE.Color();

export default function useInteractions({ buffers, countryTypeToIdx }) {
  const enableMapInteractions = useRoomStore(
    (state) => state.enableMapInteractions,
  );

  const hoveredCountry = useRoomStore((state) => state.hoveredCountry);
  const showCountryPoints = useRoomStore((state) => state.showCountryPoints);
  const pointsValue = useRoomStore((state) => state.pointsValue);

  const flowsMap = useRoomStore((state) => state.flowsMap);
  const remRadiusScale = useRoomStore((state) => state.remRadiusScale);
  const propGdpRadiusScale = useRoomStore((state) => state.propGdpRadiusScale);
  const remToColorScale = useRoomStore((state) => state.remToColorScale);
  const remFromColorScale = useRoomStore((state) => state.remFromColorScale);
  const propGdpFromColorScale = useRoomStore(
    (state) => state.propGdpFromColorScale,
  );
  const propGdpToColorScale = useRoomStore(
    (state) => state.propGdpToColorScale,
  );

  const animRef = useRef(null);

  // Get target sizes and colors
  const { sizeTargets, colorTargets, sizeScale, colorScale } = useMemo(() => {
    if (!buffers) return {};

    let sizeTargets;
    let colorTargets;
    let sizeScale;
    let colorScale;

    if (pointsValue[0] === "absolute") {
      sizeTargets = buffers.size.og;
      colorTargets = buffers.color.og;

      sizeScale = (d) => remRadiusScale(d.flow.sim_remittances_with);

      colorScale = (d, flowType) => {
        if (flowType === "origin") {
          return remToColorScale(d.flow.sim_remittances_with);
        }
        if (flowType === "destination") {
          return remFromColorScale(d.flow.sim_remittances_with);
        }
      };
    }

    if (pointsValue[0] === "propGdp") {
      sizeTargets = buffers.size.propGdp;
      colorTargets = buffers.color.propGdp;

      // FIXME: d.flow.prop_of_gdp does not exist
      sizeScale = (d) => propGdpRadiusScale(d.flow.prop_of_gdp);

      colorScale = (d, flowType) => {
        if (flowType === "origin") {
          console.log(d.flow.prop_of_gdp);
          return propGdpToColorScale(d.flow.prop_of_gdp);
        }
        if (flowType === "destination") {
          return propGdpFromColorScale(d.flow.prop_of_gdp);
        }
      };
    }

    return {
      sizeTargets,
      colorTargets,
      sizeScale,
      colorScale,
    };
  }, [pointsValue, buffers]);

  // Animate on hovered country change
  useEffect(() => {
    if (!enableMapInteractions) return;

    if (
      !flowsMap ||
      !buffers ||
      !countryTypeToIdx ||
      !remRadiusScale ||
      !remToColorScale ||
      !remFromColorScale ||
      !sizeTargets ||
      !colorTargets ||
      !sizeScale ||
      !colorScale
    )
      return;

    const sizeArr = buffers.size.buffer.array;
    const colorArr = buffers.color.buffer.array;
    const sizeSnapshot = sizeArr.slice();
    const colorSnapshot = colorArr.slice();

    // Init copies (to be mutated)
    const sizeTargetsProcessed = hoveredCountry
      ? new Float32Array(sizeArr.length)
      : sizeTargets.slice();
    const colorTargetsProcessed = colorTargets.slice();

    // If hovered, change target values
    if (hoveredCountry) {
      // NOTE: Don't handle first
      if (pointsValue[0] === "propGdp") return

      const { type, country } = hoveredCountry;
      const highlightFlows = flowsMap.get(type).get(country);

      highlightFlows.forEach((d) => {
        const flowType = type === "origin" ? "destination" : "origin";

        const idx = countryTypeToIdx.get(flowType).get(d.flow[flowType]);

        sizeTargetsProcessed[idx] = sizeScale(d);

        colorDummy.setStyle(colorScale(d, flowType));

        colorTargetsProcessed[idx * 4] = colorDummy.r;
        colorTargetsProcessed[idx * 4 + 1] = colorDummy.g;
        colorTargetsProcessed[idx * 4 + 2] = colorDummy.b;
      });

      // Hovered country should be the same
      const countryOriginIdx = countryTypeToIdx.get("origin").get(country);
      const countryDestIdx = countryTypeToIdx.get("destination").get(country);

      sizeTargetsProcessed[countryOriginIdx] = sizeTargets[countryOriginIdx];
      sizeTargetsProcessed[countryDestIdx] = sizeTargets[countryDestIdx];
    }

    animRef.current = animate(0, 1, {
      duration: 0.5,
      ease: "easeOut",
      onUpdate: (t) => {
        for (let i = 0; i < sizeArr.length; i++) {
          sizeArr[i] =
            sizeSnapshot[i] + (sizeTargetsProcessed[i] - sizeSnapshot[i]) * t;
        }
        for (let i = 0; i < colorArr.length; i++) {
          colorArr[i] =
            colorSnapshot[i] +
            (colorTargetsProcessed[i] - colorSnapshot[i]) * t;
        }
        buffers.size.buffer.needsUpdate = true;
        buffers.color.buffer.needsUpdate = true;
      },
    });

    return () => animRef.current?.stop();
  }, [
    hoveredCountry,
    flowsMap,
    buffers,
    countryTypeToIdx,
    remRadiusScale,
    remToColorScale,
    remFromColorScale,
    enableMapInteractions,
    sizeTargets,
    colorTargets,
    sizeScale,
    colorScale,
    pointsValue
  ]);
}
