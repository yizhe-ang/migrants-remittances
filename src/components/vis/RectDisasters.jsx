import { useEffect, useMemo, useRef } from "react";
import * as Plot from "@observablehq/plot";
import { mean, rollup, sum } from "d3-array";
import { useRoomStore } from "@/store";

const disasterTypes = ["flood", "earthquake", "drought", "storm"];

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

const RectDisasters = ({ width = 900, height = 500 }) => {
  const containerRef = useRef();

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

    return Object.entries(o).map(([k, v]) => {
      return {
        ...v,
        disaster_type: k,
      };
    });
  }, [disastersImpactsByMonth, disasters]);

  useEffect(() => {
    if (!aggData) return;

    console.log(aggData);

    const plot = Plot.plot({
      y: {
        tickFormat: "$.0s",
        ticks: 5,
        // ticks: 0,
        label: "Remittance-induced per Affected",
        // label: null
      },
      x: {
        tickFormat: (d) => fmt.format(d),
        label: "Total Affected",
        // label: null,
        // ticks: 0,
      },
      height,
      width,
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
            stroke: "white",
            strokeWidth: 2,
            reverse: true,
          }),
        ),
      ],
    });

    containerRef.current.append(plot);

    return () => plot.remove();
  }, [aggData, width, height]);

  return (
    <div ref={containerRef} className="relative" style={{ width, height }}>
      {/* {aggData?.map((d, i) => {
        const p = labelProps[d.disaster_type];

        return (
          <div
            className="absolute translate-y-4 text-sm flex"
            style={{
              left: p.left,
              bottom: 0,
              textAlign: p.textAlign ? p.textAlign : "left",
            }}
          >
            <div className="flex flex-col">
              <span className="font-bold">{format.format(d.affected)}</span>
              <span>Affected</span>
            </div>
          </div>
        );
      })} */}
    </div>
  );
};

const format = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
});

const labelProps = {
  earthquake: {
    left: "30px",
    textAlign: "right",
  },
  storm: {
    left: "140px",
  },
  flood: {
    left: "390px",
  },
  drought: {
    left: "700px",
  },
};

export default RectDisasters;
