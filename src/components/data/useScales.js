import { useRoomStore } from "@/store";
import { extent, max } from "d3-array";
import { scaleSequentialPow, scaleSqrt } from "d3-scale";
import { interpolatePuBuGn, interpolateYlOrBr } from "d3-scale-chromatic";
import { useEffect } from "react";

export default function useScales() {
  const flowsByOrigin = useRoomStore((state) => state.flowsByOrigin);
  const flowsByDestination = useRoomStore((state) => state.flowsByDestination);
  const flowsPerYear = useRoomStore((state) => state.flowsPerYear);

  const setRemRadiusScale = useRoomStore((state) => state.setRemRadiusScale);
  const setRemToColorScale = useRoomStore((state) => state.setRemToColorScale);
  const setRemFromColorScale = useRoomStore(
    (state) => state.setRemFromColorScale,
  );
  const setFlowRadiusScale = useRoomStore((state) => state.setFlowRadiusScale);

  // rem radius scale
  useEffect(() => {
    if (!flowsByOrigin || !flowsByDestination) return;

    // TODO: use log scale or sth for this?

    const remRadiusScale = scaleSqrt()
      .domain([
        0,
        max(
          [...flowsByDestination, ...flowsByOrigin],
          (d) => d.sim_remittances_with,
        ),
      ])
      .range([0.7, 10]);

    setRemRadiusScale(remRadiusScale);
  }, [flowsByDestination, flowsByOrigin]);

  // rem to color scale
  useEffect(() => {
    if (!flowsByOrigin) return;

    const remToColorScale = scaleSequentialPow(interpolatePuBuGn)
      .domain(extent(flowsByOrigin, (d) => d.sim_remittances_with))
      .exponent(0.4);

    setRemToColorScale(remToColorScale);
  }, [flowsByOrigin]);

  // rem from color scale
  useEffect(() => {
    if (!flowsByDestination) return;

    const remFromColorScale = scaleSequentialPow(interpolateYlOrBr)
      .domain(extent(flowsByDestination, (d) => d.sim_remittances_with))
      .exponent(0.4);

    setRemFromColorScale(remFromColorScale);
  }, [flowsByDestination]);

  // Flows radius scale
  useEffect(() => {
    if (!flowsPerYear) return;

    const flowRadiusScale = scaleSqrt()
      .domain([0, max(flowsPerYear, (d) => d.sim_remittances_with)])
      .range([0, 1000]);

    setFlowRadiusScale(flowRadiusScale);
  }, [flowsPerYear]);
}
