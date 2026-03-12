import { useRoomStore } from "@/store";
import { transitionBuffer } from "@/lib/utils";
import { useEffect, useRef } from "react";

export default function useInteractions({ buffers, u, countryTypeToIndex }) {
  const hoveredCountry = useRoomStore((state) => state.hoveredCountry);

  const flowsMap = useRoomStore((state) => state.flowsMap);
  const remRadiusScale = useRoomStore((state) => state.remRadiusScale);
  const remToColorScale = useRoomStore((state) => state.remToColorScale);
  const remFromColorScale = useRoomStore((state) => state.remFromColorScale);

  const sizeAnimRef = useRef(null);
  const colorAnimRef = useRef(null);

  // Animate on hovered country change
  useEffect(() => {
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

    if (hoveredCountry) {
      const { type, country } = hoveredCountry;
      const highlightFlows = flowsMap.get(type).get(country);

      highlightFlows.forEach((d) => {
        const idx = countryTypeToIndex
          .get(type === "origin" ? "destination" : "origin")
          .get(type === "origin" ? d.flow.destination : d.flow.origin);

        sizeTargets[idx] = remRadiusScale(d.flow.sim_remittances_with);
      });

      // Hovered country should be the same
      const countryOriginIdx = countryTypeToIndex.get("origin").get(country);
      sizeTargets[countryOriginIdx] = buffers.size.og[countryOriginIdx];

      const countryDestIdx = countryTypeToIndex.get("destination").get(country);
      sizeTargets[countryDestIdx] = buffers.size.og[countryDestIdx];

      // TODO: Animate color too
    }

    sizeAnimRef.current = transitionBuffer(
      buffers.size.from,
      buffers.size.to,
      u.sizeT,
      sizeTargets,
    );

    return () => {
      sizeAnimRef.current?.stop();
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
  ]);
}
