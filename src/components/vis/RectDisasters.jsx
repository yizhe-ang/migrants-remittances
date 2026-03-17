import { useEffect, useMemo, useRef } from "react";
import * as Plot from "@observablehq/plot";
import { useSql } from "@sqlrooms/duckdb";
import { mean, rollup, sum } from "d3-array";

const disasterTypes = ["flood", "earthquake", "drought", "storm"];

const disasterTypeMap = new Map([
  ["flood", "floods"],
  ["earthquake", "earthquakes"],
  ["storm", "storms"],
  ["drought", "droughts"],
]);

const RectDisasters = () => {
  const containerRef = useRef();

  const aggData = useMemo(() => {
    const o = Object.fromEntries(
      [...disasterTypeMap.keys()].map((v) => [v, {}]),
    );

    const remittancesByDisaster = rollup(
      disastersImpactsByMonth,
      (v) => sum(v, (d) => d.remittance),
      (d) => d.disaster_type,
    );

    const affectedByDisaster = rollup(
      disastersProcessed,
      (v) => sum(v, (d) => d.affected),
      (d) => d["disaster_type"],
    );

    const affectedPerOccurrence = rollup(
      disastersProcessed,
      (v) => mean(v, (d) => d.affected),
      (d) => d["disaster_type"],
    );

    [...disasterTypeMap.keys()].forEach((k) => {
      o[k].remittances = remittancesByDisaster.get(disasterTypeMap.get(k));

      o[k].affected = affectedByDisaster.get(k);
      o[k].affected_per_occurrence = affectedPerOccurrence.get(k);

      o[k].remittance_per_affected = o[k].remittances / o[k].affected;
    });

    return Object.entries(o).map(([k, v]) => {
      return {
        ...v,
        disaster_type: k,
      };
    });
  }, [disastersImpactsByMonth, disastersProcessed]);

  useEffect(() => {
    const plot = Plot.plot({
      height: 300,
      width: 700,
      marginLeft: 80,
      color: {
        // legend: true,
        domain: disasterTypes,
      },
      marks: [
        Plot.rectY(
          aggData,
          Plot.stackX({
            x: "affected",
            y2: "remittance_per_affected",
            fill: "disaster_type",
            order: "remittance_per_affected",
            reverse: true,
          }),
        ),
      ],
    });

    containerRef.current.append(plot);

    return () => plot.remove();
  }, []);

  return <div ref={containerRef}></div>;
};

export default RectDisasters;
