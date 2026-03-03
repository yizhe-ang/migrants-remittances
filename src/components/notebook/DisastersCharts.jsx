import { useEffect, useMemo, useRef } from "react";
import * as Plot from "@observablehq/plot";
import { useSql } from "@sqlrooms/duckdb";
import { mean, rollup, sum } from "d3-array";

const disasterTypeMap = new Map([
  ["Flood", "floods"],
  ["Earthquake", "earthquakes"],
  ["Storm", "storms"],
  ["Drought", "droughts"],
]);

const DisastersCharts = ({ ...props }) => {
  const { disasters, disastersImpactsByMonth } = props;

  // TODO: Connect disasters to their geographical location

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

    const affectedPerOccurrence = rollup(
      disastersProcessed,
      (v) => mean(v, (d) => d.Affected),
      (d) => d["Disaster Type"],
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

  const containerRef1 = useRef();
  const containerRef2 = useRef();
  const containerRef3 = useRef();
  const containerRef4 = useRef();
  const containerRef5 = useRef();
  const containerRef6 = useRef();

  // Bee swarm
  useEffect(() => {
    const plot = Plot.plot({
      // title: "People affected by each disaster, over time",
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
      height: 400,
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
          fy: "disaster_type",
          // order: "sum",
          // offset: "wiggle",
        }),
      ],
    });

    containerRef5.current.append(plot);

    return () => plot.remove();
    // DEBUG:
  });
  // }, []);

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
    // const plot = Plot.plot({
    //   height: 400,
    //   width: 700,
    //   marginLeft: 80,
    //   color: {
    //     // legend: true,
    //     domain: ["Flood", "Earthquake", "Drought", "Storm"],
    //   },
    //   marks: [
    //     Plot.areaY(
    //       disastersProcessed,
    //       Plot.binX(
    //         {
    //           y: "sum",
    //         },
    //         {
    //           x: "Date",
    //           y: "Affected",
    //           fy: "Disaster Type",
    //           fill: "Disaster Type",
    //           interval: "year",
    //           interval: "month",
    //           // offset: "normalize",
    //           order: "sum",
    //           filter: (d) => d['Disaster Type'] === "Flood",
    //         },
    //       ),
    //     ),
    //   ],
    // });

    // containerRef4.current.append(plot);

    const plots = ["Flood", "Earthquake", "Drought", "Storm"].map(
      (disasterType) => {
        const plot = Plot.plot({
          height: 100,
          width: 700,
          marginLeft: 80,
          color: {
            // legend: true,
            domain: ["Flood", "Earthquake", "Drought", "Storm"],
          },
          y: {
            // type: "log",
          },
          marks: [
            Plot.areaY(
              disastersProcessed,
              Plot.binX(
                {
                  y: "sum",
                },
                {
                  x: "Date",
                  y: "Affected",
                  fill: "Disaster Type",
                  // interval: "year",
                  interval: "month",
                  filter: (d) => d["Disaster Type"] === disasterType,
                },
              ),
            ),
          ],
        });

        containerRef4.current.append(plot);

        return plot;
      },
    );

    return () => {
      plots.forEach((plot) => plot.remove());
    };
    // DEBUG:
  });
  // }, []);

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

    const plot2 = Plot.plot({
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
            x: "affected_per_occurrence",
            y2: "remittance_per_affected",
            fill: "disaster_type",
            order: "remittance_per_affected",
            reverse: true,
          }),
        ),
      ],
    });

    containerRef6.current.append(plot);
    // containerRef6.current.append(plot2);

    return () => {
      plot.remove();
      plot2.remove();
    };
    // DEBUG:
  });
  // }, []);

  return (
    <div className="mt-20 flex flex-col">
      <div className="w-xl mx-auto mt-5">
        <div className="">
          <b>Disasters</b>, and <b>number of people affected</b> from{" "}
          <u>2010 to 2019</u>
        </div>

        <div className="text-xs mt-2">
          According to EMDAT, between 2010 and 2019, there were around 3,000
          disaster events connected to the occurrence of floods, storms,
          earthquakes, and droughts. These events affected a total of 1.74
          billion people, the vast majority of whom lived in lower-middle-income
          and upper-middle-income countries
        </div>
      </div>

      <div className="mx-auto mt-5" ref={containerRef1} />

      {/* TODO: Where are these disasters occurring? And who do they affect? */}
      {/* <div className="w-xl mx-auto mt-5 bg-gray-300">
        Disasters by geographical location
      </div>
      <div className="w-xl mx-auto mt-5">
        Color by income group?
      </div> */}

      <div className="mx-auto mt-5" ref={containerRef3} />

      <div className="mx-auto mt-5" ref={containerRef4} />

      <div className="mx-auto mt-5" ref={containerRef5} />

      {/* <div className="w-xl mx-auto mt-5 text-xs">
        We estimate that the occurrence of a disaster, on average, increases
        remittance sending for up to nine months after the event, with a peak
        around the fourth month after the event, and a small negative effect
        after the ninth month. The disaster-induced flow of international
        remittances between 2010 and 2019 amounted to circa 332 billion USD,
        equivalent to 5.46% of total remittance flows.
      </div>

      <div className="w-xl mx-auto mt-5 text-xs">
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
      </div> */}

      <div className="w-xl mx-auto mt-5 text-xs">
        Earthquake-induced remittances were also unstable: a large spike at the
        beginning of 2018 was driven by the earthquakes that affected Mexico in
        2017 and Indonesia in 2018.
      </div>

      <div className="mx-auto mt-5" ref={containerRef2} />

      <div className="w-xl mx-auto mt-10">
        <div className="leading-tight">
          Number of <b>people affected</b>, and <br />{" "}
          <b>remittance induced per affected</b> by <b>disaster type</b>
        </div>
      </div>

      <div className="mx-auto mt-5" ref={containerRef6} />

      <div className="w-xl mx-auto mt-5 text-xs">
        Floods moved the largest amount of remittances, with a total of 138
        billion USD. The large mobilization is due to the combination of size
        and frequency of flooding events with their occurrence in countries with
        large international diasporas, such as China, Pakistan and Bangladesh.
      </div>

      <div className="w-xl mx-auto mt-5 text-xs">
        Not all disasters generate the same remittances mobilisation. Comparing
        total disasterinduced remittances with the number of people affected for
        each disaster category shows that earthquakes accounted for the largest
        relative amount, with 542 USD per affected person. Earthquakes are
        sudden and cause large impacts, and have occurred in countries with
        diasporas that could be activated. On the contrary, droughts caused the
        smallest relative impact, with 142 USD per affected person. Droughts are
        a creeping phenomenon: their effects accumulate slowly, and they last
        for prolonged periods of time [67]. For this reason, migrant diasporas
        cannot sustain sending higher amounts of remittances for events that
        last long periods. The differences in remittances induced by disasters
        are also explained by the countries affected and the location of their
        migrant diasporas, as diasporas in richer countries can send larger
        sums.
      </div>

      <div className="w-xl mx-auto mt-5 text-xs">
        Remittances are not a uniform coping mechanism but vary depending on
        hazard characteristics, exposure, and diaspora location and condition.
      </div>

      <div className="w-xl mx-auto mt-10">
        <div className="font-bold">Notable disaster events</div>
      </div>

      <div className="w-xl mx-auto mt-10">
        <div className="font-bold">
          Where do these disasters occur, who do they affect, and how do they
          respond?
        </div>
      </div>

      <div className="w-xl mx-auto mt-10">
        <div className="font-bold">
          Disaster-induced remittances is affected by both magnitude of disaster
          and characteristics of migrant diasporas
        </div>
      </div>
    </div>
  );
};

export default DisastersCharts;
