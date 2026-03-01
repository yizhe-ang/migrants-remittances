import { useEffect, useMemo, useRef } from "react";
import * as Plot from "@observablehq/plot";
import { useSql } from "@sqlrooms/duckdb";

const DisastersCharts = ({ ...props }) => {
  const { disasters, disastersImpacts } = props;

  const disastersProcessed = useMemo(() => {
    return disasters.toArray().map((d) => {
      return {
        ...d,
        Date: new Date(d.Date),
        Affected: Number(d.Affected),
      };
    });
  }, [disasters]);

  const containerRef1 = useRef();
  const containerRef2 = useRef();
  const containerRef3 = useRef();
  const containerRef4 = useRef();

  useEffect(() => {
    const plot = Plot.plot({
      height: 500,
      width: 700,
      color: {
        legend: true,
        domain: ["Flood", "Earthquake", "Drought", "Storm"],
      },
      r: {
        range: [0, 70],
        // legend: true
      },
      marks: [
        Plot.dot(
          disastersProcessed,
          Plot.dodgeY("middle", {
            x: "Date",
            r: "Affected",
            fill: "Disaster Type",
          }),
        ),
      ],
    });

    containerRef1.current.append(plot);

    return () => plot.remove();
    // DEBUG:
    // });
  }, []);

  useEffect(() => {
    const plot = Plot.plot({
      title: "Total people affected by disasters, from 2010 to 2019",
      height: 110,
      width: 700,
      marginLeft: 90,
      color: {
        // legend: true,
        domain: ["Flood", "Earthquake", "Drought", "Storm"],
      },
      marks: [
        Plot.barX(
          disastersProcessed,
          Plot.groupY(
            {
              x: "sum",
            },
            {
              x: "Affected",
              y: "Disaster Type",
              fill: "Disaster Type",
              sort: { y: "x", reverse: true },
            },
          ),
        ),
      ],
    });
    containerRef4.current.append(plot);

    const plot2 = Plot.plot({
      title: "Average people affected by each disaster occurrence",
      height: 110,
      width: 700,
      marginLeft: 90,
      color: {
        // legend: true,
        domain: ["Flood", "Earthquake", "Drought", "Storm"],
      },
      marks: [
        Plot.barX(
          disastersProcessed,
          Plot.groupY(
            {
              x: "mean",
            },
            {
              x: "Affected",
              y: "Disaster Type",
              fill: "Disaster Type",
              sort: { y: "x", reverse: true },
            },
          ),
        ),
      ],
    });
    containerRef4.current.append(plot2);

    const plot3 = Plot.plot({
      title: "Occurrences of each disaster type",
      height: 110,
      width: 700,
      marginLeft: 90,
      color: {
        // legend: true,
        domain: ["Flood", "Earthquake", "Drought", "Storm"],
      },
      marks: [
        Plot.barX(
          disastersProcessed,
          Plot.groupY(
            {
              x: "count",
            },
            {
              x: "Affected",
              y: "Disaster Type",
              fill: "Disaster Type",
              sort: { y: "x", reverse: true },
            },
          ),
        ),
      ],
    });
    containerRef4.current.append(plot3);

    return () => {
      plot.remove();
      plot2.remove();
      plot3.remove();
    };
    // DEBUG:
  });
  // }, []);

  // useEffect(() => {
  //   const plot = Plot.plot({
  //     height: 500,
  //     width: 700,
  //     color: {
  //       legend: true,
  //       domain: ["Flood", "Earthquake", "Drought", "Storm"],
  //     },
  //     marks: [
  //       // Plot.areaY(
  //       Plot.rectY(disastersProcessed, {
  //         x: "Date",
  //         y: "Affected",
  //         fill: "Disaster Type",
  //         interval: "month",
  //       }),
  //     ],
  //   });

  //   containerRef2.current.append(plot);

  //   return () => plot.remove();
  //   // DEBUG:
  // // });
  // }, []);

  // useEffect(() => {
  //   const plot = Plot.plot({
  //     height: 500,
  //     width: 700,
  //     color: {
  //       legend: true,
  //       domain: ["Flood", "Earthquake", "Drought", "Storm"],
  //     },
  //     marks: [
  //       // Plot.areaY(
  //       Plot.rectY(disastersProcessed, {
  //         x: "Date",
  //         y: "Affected",
  //         fill: "Disaster Type",
  //         interval: "month",
  //       }),
  //     ],
  //   });

  //   containerRef3.current.append(plot);

  //   return () => plot.remove();
  //   // DEBUG:
  // });
  // }, []);

  return (
    <div className="mt-20 flex flex-col">
      <div className="w-xl mx-auto mt-5 text-sm">
        According to EMDAT, between 2010 and 2019, there were around 3,000
        disaster events connected to the occurrence of floods, storms,
        earthquakes, and droughts. These events affected a total of 1.74 billion
        people, the vast majority of whom lived in lower-middle-income and
        upper-middle-income countries
      </div>

      <div className="mx-auto mt-5" ref={containerRef1} />

      <div className="mx-auto mt-5" ref={containerRef4} />

      <div className="mx-auto mt-5" ref={containerRef2} />

      <div className="mx-auto mt-5" ref={containerRef3} />

      <div className="w-xl mx-auto mt-5 text-sm">
        We estimate that the occurrence of a disaster, on average, increases
        remittance sending for up to nine months after the event, with a peak
        around the fourth month after the event, and a small negative effect
        after the ninth month. The disaster-induced flow of international
        remittances between 2010 and 2019 amounted to circa 332 billion USD,
        equivalent to 5.46% of total remittance flows.
      </div>

      <div className="w-xl mx-auto mt-5 text-sm">
        The five countries that received the largest absolute amounts of
        disaster-induced remittances are, in order, China, India, the
        Philippines, Mexico, and Bangladesh. These countries combined received
        around 186 billion USD in disaster-induced remittances over the 2010 to
        2019 period, which is equivalent to 56% of the total. The relative
        amount of disaster-induced remittances received by each country largely
        reflects the number and magnitude of disaster events that hit the
        country, while the total amounts also depend on the characteristics of
        the diasporas abroad. All of these countries are estimated to have more
        than 6 million migrants living abroad.
      </div>
    </div>
  );
};

export default DisastersCharts;
