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

  useEffect(() => {
    if (!disastersImpactsByMonth) return;

    const plot = Plot.plot({
      height: height,
      width,
      marginLeft: 80,
      marginTop: 140,
      marginBottom: 0,
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
        // label: "Disaster-induced Remittances"
        label: null
      },
      color: {
        domain: ["floods", "earthquakes", "droughts", "storms"],
      },
      marks: [
        Plot.areaY(disastersImpactsByMonth, {
          x: "date",
          y: "remittance",
          fill: "disaster_type",
          fillOpacity: 0.1,
          fy: "disaster_type",
        }),
        Plot.lineY(disastersImpactsByMonth, {
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
  }, [disastersImpactsByMonth, height, width]);

  return <div ref={containerRef}></div>;
};

export default AreaDisasters;
