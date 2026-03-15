import { useRoomStore } from "@/store";
import { extent, max } from "d3-array";
import { scaleOrdinal, scaleSequentialPow, scaleSqrt } from "d3-scale";
import {
  interpolatePuBuGn,
  interpolateYlOrBr,
  schemeObservable10,
} from "d3-scale-chromatic";
import { useEffect } from "react";

export default function useScales() {
  const flowsByOrigin = useRoomStore((state) => state.flowsByOrigin);
  const flowsByDestination = useRoomStore((state) => state.flowsByDestination);
  const flowsPerYear = useRoomStore((state) => state.flowsPerYear);

  const setRemRadiusScale = useRoomStore((state) => state.setRemRadiusScale);
  const setPropGdpRadiusScale = useRoomStore(
    (state) => state.setPropGdpRadiusScale,
  );
  const setRemToColorScale = useRoomStore((state) => state.setRemToColorScale);
  const setRemFromColorScale = useRoomStore(
    (state) => state.setRemFromColorScale,
  );
  const setFlowRadiusScale = useRoomStore((state) => state.setFlowRadiusScale);
  const setIncomeColorScale = useRoomStore(
    (state) => state.setIncomeColorScale,
  );

  useEffect(() => {
    if (!flowsByOrigin || !flowsByDestination) return;

    // TODO: use log scale or sth for this?

    // rem radius scale
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

    // prop of gdp radius scale
    const propsGdpRadiusScale = scaleSqrt()
      .domain([
        0,
        max([...flowsByDestination, ...flowsByOrigin], (d) => d.prop_of_gdp),
      ])
      .range([0.7, 10]);

    setPropGdpRadiusScale(propsGdpRadiusScale);
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

  // Income color scale
  useEffect(() => {
    const incomeColorScale = scaleOrdinal()
      .domain([
        "High income",
        "Upper middle income",
        "Lower middle income",
        "Low income",
      ])
      .range(schemeObservable10);

    setIncomeColorScale(incomeColorScale);
  }, []);
}
