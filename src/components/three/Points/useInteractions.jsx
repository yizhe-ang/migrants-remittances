import { useRoomStore } from "@/store";
import { animate } from "motion";
import { useEffect, useRef } from "react";
import * as THREE from "three/webgpu";

const colorDummy = new THREE.Color();

export default function useInteractions({ buffers, countryTypeToIndex }) {
  const hoveredCountry = useRoomStore((state) => state.hoveredCountry);
  const enableMapInteractions = useRoomStore(
    (state) => state.enableMapInteractions,
  );

  const flowsMap = useRoomStore((state) => state.flowsMap);
  const remRadiusScale = useRoomStore((state) => state.remRadiusScale);
  const remToColorScale = useRoomStore((state) => state.remToColorScale);
  const remFromColorScale = useRoomStore((state) => state.remFromColorScale);

  const animRef = useRef(null);

  // Animate on hovered country change
  useEffect(() => {
    if (!enableMapInteractions) return;

    if (
      !flowsMap ||
      !buffers ||
      !countryTypeToIndex ||
      !remRadiusScale ||
      !remToColorScale ||
      !remFromColorScale
    )
      return;

    const sizeArr = buffers.size.buffer.value.array;
    const colorArr = buffers.color.buffer.value.array;
    const sizeSnapshot = sizeArr.slice();
    const colorSnapshot = colorArr.slice();

    const sizeTargets = hoveredCountry
      ? new Float32Array(sizeArr.length)
      : new Float32Array(buffers.size.og);

    const colorTargets = buffers.color.og.slice();

    if (hoveredCountry) {
      const { type, country } = hoveredCountry;
      const highlightFlows = flowsMap.get(type).get(country);

      highlightFlows.forEach((d) => {
        const flowType = type === "origin" ? "destination" : "origin";

        const idx = countryTypeToIndex.get(flowType).get(d.flow[flowType]);

        sizeTargets[idx] = remRadiusScale(d.flow.sim_remittances_with);

        if (flowType === "origin") {
          colorDummy.setStyle(remToColorScale(d.flow.sim_remittances_with));
        } else {
          colorDummy.setStyle(remFromColorScale(d.flow.sim_remittances_with));
        }
        colorTargets[idx * 4] = colorDummy.r;
        colorTargets[idx * 4 + 1] = colorDummy.g;
        colorTargets[idx * 4 + 2] = colorDummy.b;
      });

      // Hovered country should be the same
      const countryOriginIdx = countryTypeToIndex.get("origin").get(country);
      const countryDestIdx = countryTypeToIndex.get("destination").get(country);

      sizeTargets[countryOriginIdx] = buffers.size.og[countryOriginIdx];
      sizeTargets[countryDestIdx] = buffers.size.og[countryDestIdx];
    }

    animRef.current = animate(0, 1, {
      duration: 0.5,
      ease: "easeOut",
      onUpdate: (t) => {
        for (let i = 0; i < sizeArr.length; i++) {
          sizeArr[i] = sizeSnapshot[i] + (sizeTargets[i] - sizeSnapshot[i]) * t;
        }
        for (let i = 0; i < colorArr.length; i++) {
          colorArr[i] = colorSnapshot[i] + (colorTargets[i] - colorSnapshot[i]) * t;
        }
        buffers.size.buffer.value.needsUpdate = true;
        buffers.color.buffer.value.needsUpdate = true;
      },
    });

    return () => animRef.current?.stop();
  }, [
    hoveredCountry,
    flowsMap,
    buffers,
    countryTypeToIndex,
    remRadiusScale,
    remToColorScale,
    remFromColorScale,
    enableMapInteractions,
  ]);
}
