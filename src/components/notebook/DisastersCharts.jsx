import { useEffect, useMemo, useRef } from "react";
import * as Plot from "@observablehq/plot";
import { useSql } from "@sqlrooms/duckdb";
import { rollup, sum } from "d3-array";

const disasterTypeMap = new Map([
  ["Flood", "floods"],
  ["Earthquake", "earthquakes"],
  ["Storm", "storms"],
  ["Drought", "droughts"],
]);

const DisastersCharts = ({ ...props }) => {
  const { disasters, disastersImpactsByMonth } = props;

  const disastersProcessed = useMemo(() => {
    return disasters.toArray().map((d) => {
      return {
        ...d,
        Date: new Date(d.Date),
        Affected: Number(d.Affected),
      };
    });
  }, [disasters]);

  const disastersImpactsByMonthProcessed = useMemo(() => {
    return disastersImpactsByMonth.toArray().map((d) => {
      return {
        ...d,
        date: new Date(d.date),
        // Affected: Number(d.Affected),
      };
    });
  }, [disastersImpactsByMonth]);

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
      (v) => sum(v, (d) => d.Affected),
      (d) => d["Disaster Type"],
    );

    [...disasterTypeMap.keys()].forEach((k) => {
      o[k].remittances = remittancesByDisaster.get(disasterTypeMap.get(k));

      o[k].affected = affectedByDisaster.get(k);

      o[k].remittance_per_affected = o[k].remittances / o[k].affected;
    });

    return Object.entries(o).map(([k, v]) => {
      return {
        ...v,
        disaster_type: k,
      };
    });
  }, [disastersImpactsByMonth, disastersProcessed]);

  console.log(aggData);

  const containerRef1 = useRef();
  const containerRef2 = useRef();
  const containerRef3 = useRef();
  const containerRef4 = useRef();
  const containerRef5 = useRef();
  const containerRef6 = useRef();

  // Bee swarm
  useEffect(() => {
    const plot = Plot.plot({
      title: "People affected by each disaster, over time",
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
            // fy: "Disaster Type",
          }),
        ),
      ],
    });

    const plot2 = Plot.plot({
      height: 700,
      width: 700,
      marginLeft: 20,
      marginTop: 50,
      color: {
        // legend: true,
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
            fy: "Disaster Type",
          }),
        ),
      ],
    });

    containerRef1.current.append(plot);
    containerRef1.current.append(plot2);

    return () => {
      plot.remove();
      plot2.remove();
    };
    // DEBUG:
  });
  // }, []);

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
    // });
  }, []);

  useEffect(() => {
    const plot = Plot.plot({
      title: "Remittances induced by each disaster type, over time",
      height: 300,
      width: 700,
      marginLeft: 80,
      color: {
        domain: ["floods", "earthquakes", "droughts", "storms"],
      },
      marks: [
        Plot.areaY(disastersImpactsByMonthProcessed, {
          x: "date",
          y: "remittance",
          fill: "disaster_type",
          // order: "sum",
          offset: "wiggle",
        }),
      ],
    });

    containerRef5.current.append(plot);

    return () => plot.remove();
    // DEBUG:
    // });
  }, []);

  useEffect(() => {
    const plot = Plot.plot({
      title:
        "Total remittances induced by each disaster type, from 2010 to 2019",
      height: 110,
      width: 700,
      marginLeft: 90,
      color: {
        domain: ["floods", "earthquakes", "droughts", "storms"],
      },
      marks: [
        Plot.barX(
          disastersImpactsByMonthProcessed,
          Plot.groupY(
            {
              x: "sum",
            },
            {
              y: "disaster_type",
              x: "remittance",
              fill: "disaster_type",
              sort: { y: "x", reverse: true },
            },
          ),
        ),
      ],
    });

    containerRef2.current.append(plot);

    return () => plot.remove();
    // DEBUG:
  });
  // }, []);

  useEffect(() => {
    const plot = Plot.plot({
      height: 500,
      width: 700,
      marginLeft: 80,
      color: {
        // legend: true,
        domain: ["Flood", "Earthquake", "Drought", "Storm"],
      },
      marks: [
        Plot.areaY(
          disastersProcessed,
          Plot.binX(
            {
              y: "sum",
              filter: null,
            },
            {
              x: "Date",
              y: "Affected",
              fill: "Disaster Type",
              interval: "year",
              // offset: "normalize",
              order: "sum",
            },
          ),
        ),
      ],
    });

    containerRef4.current.append(plot);

    return () => plot.remove();
    // DEBUG:
    // });
  }, []);

  useEffect(() => {
    const plot = Plot.plot({
      height: 300,
      width: 700,
      marginLeft: 80,
      color: {
        // legend: true,
        domain: ["Flood", "Earthquake", "Drought", "Storm"],
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

    containerRef6.current.append(plot);

    return () => plot.remove();
    // DEBUG:
  });
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

      <div className="mx-auto mt-5" ref={containerRef3} />

      <div className="mx-auto mt-5" ref={containerRef4} />

      <div className="mx-auto mt-5" ref={containerRef5} />

      <div className="mx-auto mt-5" ref={containerRef2} />

      <div className="mx-auto mt-5" ref={containerRef6} />

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
