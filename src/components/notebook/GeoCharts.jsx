import { useEffect, useRef } from "react";
import countriesGeo from "./data/countries_geo.json";
import * as Plot from "@observablehq/plot";
import colors from "tailwindcss/colors";

const GeoCharts = ({ data }) => {
  const containerRef1 = useRef();
  const containerRef2 = useRef();

  useEffect(() => {
    const plot = Plot.plot({
      projection: "equal-earth",
      width: 1000,
      height: 500,
      color: {
        scheme: "viridis",
      },
      marks: [
        Plot.sphere({ fill: "white", stroke: colors.gray[200] }),
        Plot.geo(countriesGeo, {
          // fill: slate["100"],
          fill: colors.gray[100],
          stroke: "white",
          strokeWidth: 1,
        }),
        Plot.dot(data, {
          r: "sim_remittances_with_per_capita",
          fill: "sim_remittances_with_per_capita",
          x: "longitude",
          y: "latitude",
          strokeWidth: 1,
          stroke: colors.gray[100],
        }),
      ],
    });

    containerRef1.current.append(plot);

    return () => plot.remove();
    // DEBUG:
  });
  // }, []);

  // useEffect(() => {
  //   const plot = Plot.plot({
  //     projection: "equal-earth",
  //     width: 1000,
  //     height: 500,
  //     color: {
  //       scheme: "PuBuGn",
  //     },
  //     length: {
  //       range: [0, 100],
  //     },
  //     marks: [
  //       Plot.sphere({ fill: "white", stroke: colors.gray[200] }),
  //       Plot.geo(countriesGeo, {
  //         // fill: slate["100"],
  //         fill: colors.gray[100],
  //         stroke: "white",
  //         strokeWidth: 1,
  //       }),
  //       Plot.spike(data, {
  //         length: "sim_remittances_with_per_capita",
  //         fill: "sim_remittances_with_per_capita",
  //         x: "longitude",
  //         y: "latitude",
  //         strokeWidth: 1,
  //         stroke: colors.gray[100],
  //       }),
  //     ],
  //   });

  //   containerRef2.current.append(plot);

  //   return () => plot.remove();
  // }, []);

  return (
    <div className="mt-5 flex flex-col">
      <div>
        Remittances received
      </div>

      <div ref={containerRef1} className="mx-auto" />
      {/* <div ref={containerRef2} /> */}
    </div>
  );
};

export default GeoCharts;
