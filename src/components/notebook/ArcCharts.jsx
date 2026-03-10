import * as Plot from "@observablehq/plot";
import { index } from "d3-array";
import { useEffect, useMemo, useRef } from "react";

const ArcCharts = ({ ...props }) => {
  const { flowsPerYear, countriesStats } = props;

  console.log(countriesStats);
  console.log(flowsPerYear);

  const containerRef1 = useRef();

  useEffect(() => {
    const nodesSet = new Set();
    flowsPerYear.forEach((d) => {
      nodesSet.add(d.origin);
      nodesSet.add(d.destination);
    });
    const nodes = [...nodesSet].map((country) => ({ country }));

    const countriesStatsIndex = index(countriesStats, (d) => d.country);

    const plot = Plot.plot({
      height: 2000,
      width: 1000,
      color: {
        legend: true,
      },
      x: { domain: [0, 1] },
      marks: [
        Plot.dot(nodes, {
          x: 0,
          y: "country",
          fill: (d) => countriesStatsIndex.get(d.country).group,
          sort: { y: "fill", reverse: false },
        }),
        Plot.arrow(flowsPerYear, {
          x: 0,
          y1: "destination",
          y2: "origin",
          sweep: "-y",
          bend: 90,
          headLength: 0,
          strokeOpacity: 0.05,
          strokeWidth: (d) => d.sim_remittances_with / 100000000,
        }),
      ],
    });

    containerRef1.current.append(plot);

    return () => {
      plot.remove();
    };
    // }, []);
  });

  return (
    <div>
      <div ref={containerRef1} />
    </div>
  );
};

export default ArcCharts;
