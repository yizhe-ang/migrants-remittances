import { useRoomStore } from "@/store";
import { transitionBuffer } from "@/lib/utils";
import { useEffect, useRef } from "react";
import * as THREE from "three/webgpu";

const colorDummy = new THREE.Color();

export default function useInteractions({ buffers, u, countryTypeToIndex }) {
  const hoveredCountry = useRoomStore((state) => state.hoveredCountry);
  const enableMapInteractions = useRoomStore(
    (state) => state.enableMapInteractions,
  );

  const flowsMap = useRoomStore((state) => state.flowsMap);
  const remRadiusScale = useRoomStore((state) => state.remRadiusScale);
  const remToColorScale = useRoomStore((state) => state.remToColorScale);
  const remFromColorScale = useRoomStore((state) => state.remFromColorScale);

  const sizeAnimRef = useRef(null);
  const colorAnimRef = useRef(null);

  // Animate on hovered country change
  useEffect(() => {
    if (!enableMapInteractions) return;

    if (
      !flowsMap ||
      !u ||
      !buffers ||
      !countryTypeToIndex ||
      !remRadiusScale ||
      !remToColorScale ||
      !remFromColorScale
    )
      return;

    const sizeTargets = hoveredCountry
      ? new Float32Array(buffers.size.from.value.array.length)
      : buffers.size.og;

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

    sizeAnimRef.current = transitionBuffer(
      buffers.size.from,
      buffers.size.to,
      u.sizeT,
      sizeTargets,
    );

    colorAnimRef.current = transitionBuffer(
      buffers.color.from,
      buffers.color.to,
      u.colorT,
      colorTargets,
    );

    return () => {
      sizeAnimRef.current?.stop();
      colorAnimRef.current?.stop();
    };
  }, [
    hoveredCountry,
    flowsMap,
    buffers,
    u,
    countryTypeToIndex,
    remRadiusScale,
    remToColorScale,
    remFromColorScale,
    enableMapInteractions,
  ]);
}
