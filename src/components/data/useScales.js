import { useRoomStore } from "@/store";
import { extent, max } from "d3-array";
import {
  scaleLog,
  scaleOrdinal,
  scaleSequential,
  scaleSequentialLog,
  scaleSequentialPow,
  scaleSqrt,
} from "d3-scale";
import {
  interpolatePuBuGn,
  interpolateYlOrBr,
  schemeAccent,
  schemeObservable10,
  schemeSet1,
  schemeSet2,
  schemeSet3,
  schemeTableau10,
} from "d3-scale-chromatic";
import { useEffect } from "react";

export default function useScales() {
  const flowsByOrigin = useRoomStore((state) => state.flowsByOrigin);
  const flowsByDestination = useRoomStore((state) => state.flowsByDestination);
  const flowsPerYear = useRoomStore((state) => state.flowsPerYear);
  const disasters = useRoomStore((state) => state.disasters);

  const setRemRadiusScale = useRoomStore((state) => state.setRemRadiusScale);
  const setPropGdpRadiusScale = useRoomStore(
    (state) => state.setPropGdpRadiusScale,
  );
  const setRemToColorScale = useRoomStore((state) => state.setRemToColorScale);
  const setRemFromColorScale = useRoomStore(
    (state) => state.setRemFromColorScale,
  );
  const setFlowRadiusScale = useRoomStore((state) => state.setFlowRadiusScale);
  const setFlowPropRadiusScale = useRoomStore(
    (state) => state.setFlowPropRadiusScale,
  );
  const setIncomeColorScale = useRoomStore(
    (state) => state.setIncomeColorScale,
  );
  const setPropGdpFromColorScale = useRoomStore(
    (state) => state.setPropGdpFromColorScale,
  );
  const setPropGdpToColorScale = useRoomStore(
    (state) => state.setPropGdpToColorScale,
  );
  const setDisasterTypeColorScale = useRoomStore(
    (state) => state.setDisasterTypeColorScale,
  );
  const setDisastersRadiusScale = useRoomStore(
    (state) => state.setDisastersRadiusScale,
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
      .range([1.3, 13]);

    setRemRadiusScale(remRadiusScale);

    // prop of gdp radius scale
    const propsGdpRadiusScale = scaleSqrt()
      .domain([
        0,
        max([...flowsByDestination, ...flowsByOrigin], (d) => d.prop_of_gdp),
      ])
      .range([1.3, 10]);

    setPropGdpRadiusScale(propsGdpRadiusScale);
  }, [flowsByDestination, flowsByOrigin]);

  // rem to color scale
  useEffect(() => {
    if (!flowsByOrigin) return;

    // const remToColorScale = scaleSequentialPow(interpolatePuBuGn)
    const remToColorScale = scaleSequentialPow(() => "#dea193")
      .domain(extent(flowsByOrigin, (d) => d.sim_remittances_with))
      .exponent(0.35);

    setRemToColorScale(remToColorScale);

    const propGdpToColorScale = scaleSequentialPow(interpolatePuBuGn)
      .domain(extent(flowsByOrigin, (d) => d.prop_of_gdp))
      .exponent(0.35);

    // console.log("propGdpToColorScale domain:", propGdpToColorScale.domain());
    setPropGdpToColorScale(propGdpToColorScale);
  }, [flowsByOrigin]);

  // rem from color scale
  useEffect(() => {
    if (!flowsByDestination) return;

    // const remFromColorScale = scaleSequentialPow(interpolateYlOrBr)
    const remFromColorScale = scaleSequentialPow(() => "#dea193")
      .domain(extent(flowsByDestination, (d) => d.sim_remittances_with))
      .exponent(0.35);

    setRemFromColorScale(remFromColorScale);

    const propGdpFromColorScale = scaleSequentialPow(interpolateYlOrBr)
      .domain(extent(flowsByDestination, (d) => d.prop_of_gdp))
      .exponent(0.35);

    // console.log("propGdpFromColorScale domain:", propGdpFromColorScale.domain());
    setPropGdpFromColorScale(propGdpFromColorScale);
  }, [flowsByDestination]);

  // Flows radius scale
  useEffect(() => {
    if (!flowsPerYear) return;

    // FIXME: Is scaleSqrt good?
    const flowRadiusScale = scaleSqrt()
      .domain([0, max(flowsPerYear, (d) => d.sim_remittances_with)])
      .range([0, 1000]);

    const flowPropRadiusScale = scaleSqrt()
      .domain([
        0,
        max(
          flowsPerYear.flatMap((d) => [
            d.origin_prop_of_gdp,
            d.destination_prop_of_gdp,
          ]),
        ),
      ])
      .range([0, 1000]);

    setFlowRadiusScale(flowRadiusScale);
    setFlowPropRadiusScale(flowPropRadiusScale);
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
      .range(["#7fc97f", "#beaed4", "#fdc086", schemeSet3[11]]);
    // .range(["#7fc97f", "#beaed4", "#fdc086", schemeTableau10[8]])

    console.log(schemeSet3[11])

    setIncomeColorScale(incomeColorScale);
  }, []);

  // Disaster type color scale
  useEffect(() => {
    const disasterTypeColorScale = scaleOrdinal()
      .domain(["flood", "earthquake", "drought", "storm"])
      // .range(schemeObservable10);
      .range([
        schemeObservable10[0],
        schemeObservable10[1],
        schemeObservable10[2],
        schemeObservable10[3],
      ]);

    setDisasterTypeColorScale(disasterTypeColorScale);
  }, []);

  useEffect(() => {
    if (!disasters) return;

    // FIXME:
    const scale = scaleSqrt()
      // .domain(extent(disasters, (d) => d.affected))
      .domain([0, max(disasters, (d) => d.affected)])
      .range([0, 65]);

    setDisastersRadiusScale(scale);
  }, [disasters]);
}
