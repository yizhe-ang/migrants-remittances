import { useEffect, useMemo, useRef } from "react";
import * as Plot from "@observablehq/plot";
import { index, mean, rollup, sum } from "d3-array";
import { useRoomStore } from "@/store";

const disasterOrder = ["earthquake", "storm", "flood", "drought"];

const disasterTypeMap = new Map([
  ["flood", "floods"],
  ["earthquake", "earthquakes"],
  ["storm", "storms"],
  ["drought", "droughts"],
]);

const fmt = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const RectDisastersNew = ({ width, height }) => {
  const disastersImpactsByMonth = useRoomStore(
    (state) => state.disastersImpactsByMonth,
  );
  const disasters = useRoomStore((state) => state.disasters);

  const aggData = useMemo(() => {
    if (!disastersImpactsByMonth || !disasters) return;

    const o = Object.fromEntries(
      [...disasterTypeMap.keys()].map((v) => [v, {}]),
    );

    const remittancesByDisaster = rollup(
      disastersImpactsByMonth,
      (v) => sum(v, (d) => d.remittance),
      (d) => d.disaster_type,
    );

    const affectedByDisaster = rollup(
      disasters,
      (v) => sum(v, (d) => d.affected),
      (d) => d["disaster_type"],
    );

    const affectedPerOccurrence = rollup(
      disasters,
      (v) => mean(v, (d) => d.affected),
      (d) => d["disaster_type"],
    );

    [...disasterTypeMap.keys()].forEach((k) => {
      o[k].remittances = remittancesByDisaster.get(disasterTypeMap.get(k));

      o[k].affected = affectedByDisaster.get(k);
      o[k].affected_per_occurrence = affectedPerOccurrence.get(k);

      o[k].remittance_per_affected = o[k].remittances / o[k].affected;
    });

    const aggData = Object.entries(o).map(([k, v]) => {
      return {
        ...v,
        disaster_type: k,
      };
    });

    return aggData.sort((a, b) => {
      return (
        disasterOrder.indexOf(a.disaster_type) -
        disasterOrder.indexOf(b.disaster_type)
      );
    });
  }, [disastersImpactsByMonth, disasters]);

  const xScale = useMemo(() => {

  }, [aggData])

  return (
    <svg width={width} height={height} className="border border-black"></svg>
  );
};

export default RectDisastersNew;
