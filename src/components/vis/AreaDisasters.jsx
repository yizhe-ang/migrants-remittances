import { useEffect, useMemo, useRef } from "react";
import * as Plot from "@observablehq/plot";
import { useSql } from "@sqlrooms/duckdb";
import { mean, rollup, sum } from "d3-array";
import { useRoomStore } from "@/store";
import { format } from "d3-format";

const AreaDisasters = ({ width = 700, height = 800 }) => {
  const containerRef = useRef(null);

  const disastersImpactsByMonth = useRoomStore(
    (state) => state.disastersImpactsByMonth,
  );

  const disastersImpactsByMonthProcessed = useMemo(() => {
    if (!disastersImpactsByMonth) return null;

    return disastersImpactsByMonth.map((d) => {
      return {
        ...d,
        date: new Date(d.date),
      };
    });
  }, [disastersImpactsByMonth]);

  useEffect(() => {
    if (!disastersImpactsByMonthProcessed) return;

    const plot = Plot.plot({
      // title: "Remittances induced by each disaster type, over time",
      height: 800,
      width: 700,
      marginLeft: 80,
      marginTop: 100,
      marginBottom: -10,
      fy: {
        label: null,
        tickFormat: (d) => null,
      },
      y: {
        tickFormat: (d) => {
          const s = format("$.2s")(d);
          return s.replace("G", "B"); // D3 uses "G" (giga) not "B" (billion)
        },
        ticks: 3,
      },
      color: {
        domain: ["floods", "earthquakes", "droughts", "storms"],
      },
      marks: [
        Plot.areaY(disastersImpactsByMonthProcessed, {
          x: "date",
          y: "remittance",
          fill: "disaster_type",
          fillOpacity: 0.5,
          fy: "disaster_type",
        }),
        Plot.lineY(disastersImpactsByMonthProcessed, {
          x: "date",
          y: "remittance",
          stroke: "disaster_type",
          fy: "disaster_type",
          strokeWidth: 3,
        }),
      ],
    });

    containerRef.current.append(plot);

    return () => plot.remove();
  }, [disastersImpactsByMonthProcessed]);

  return <div ref={containerRef}></div>;
};

export default AreaDisasters;
