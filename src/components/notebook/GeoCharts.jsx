import { useEffect, useRef } from "react";
import countriesGeo from "./data/countries_geo.json";
import * as Plot from "@observablehq/plot";
import colors from "tailwindcss/colors";
import { incomeGroups } from "./utils";

const incomeGroupColor = {
  domain: incomeGroups,
  reverse: false,
  scheme: "viridis",
};

const GeoCharts = ({ ...props }) => {
  const { migAndRemByOrigin, migAndRemByDestination } = props;

  const containerRef1 = useRef();
  const containerRef2 = useRef();
  const containerRef3 = useRef();
  const containerRef4 = useRef();
  const containerRef5 = useRef();
  const containerRef6 = useRef();
  const containerRef7 = useRef();
  const containerRef8 = useRef();

  // FIXME: To fix per capita computation

  // TODO: Bring in other columns

  useGeoChart({
    ref: containerRef1,
    data: migAndRemByOrigin,
    r: "sim_remittances_with",
    fill: "sim_remittances_with",
    rMax: 30,
    // title: "Remittances received in an average year",
  });

  useGeoChart({
    ref: containerRef2,
    data: migAndRemByOrigin,
    r: "sim_remittances_with",
    fill: "group",
    rMax: 30,
    color: incomeGroupColor,
    // title: "Remittances received in an average year",
  });

  useGeoChart({
    ref: containerRef3,
    data: migAndRemByDestination,
    r: "sim_remittances_with",
    fill: "sim_remittances_with",
    rMax: 40,
    // title: "Remittances sent in an average year",
  });

  useGeoChart({
    ref: containerRef4,
    data: migAndRemByDestination,
    r: "sim_remittances_with",
    fill: "group",
    rMax: 40,
    color: incomeGroupColor,
    // title: "Remittances sent in an average year",
  });

  useGeoChart({
    ref: containerRef5,
    data: migAndRemByOrigin,
    r: "disaster_remittances",
    fill: "disaster_remittances",
    rMax: 30,
    // title: "Disaster-induced remittances received in an average year",
  });

  useGeoChart({
    ref: containerRef6,
    data: migAndRemByOrigin,
    r: "disaster_remittances",
    fill: "group",
    rMax: 30,
    color: incomeGroupColor,
    // title: "Disaster-induced remittances received in an average year",
  });

  useGeoChart({
    ref: containerRef7,
    data: migAndRemByDestination,
    r: "disaster_remittances",
    fill: "disaster_remittances",
    rMax: 30,
    // title: "Disaster-induced remittances sent in an average year",
  });

  useGeoChart({
    ref: containerRef8,
    data: migAndRemByDestination,
    r: "disaster_remittances",
    fill: "group",
    rMax: 30,
    color: incomeGroupColor,
    // title: "Disaster-induced remittances sent in an average year",
  });

  return (
    <div className="mt-10 flex flex-col items-center">
      <div className="w-xl">
        <b>Remittances received</b> in an <u>average year</u>
      </div>
      <div className="overflow-x-auto">
        <div className="flex">
          <div ref={containerRef1} className="shrink-0" />
          <div ref={containerRef2} className="shrink-0" />
        </div>
      </div>

      <div className="w-xl mt-5">
        <b>Remittances sent</b> in an <u>average year</u>
      </div>
      <div className="overflow-x-auto">
        <div className="flex">
          <div ref={containerRef3} className="shrink-0" />
          <div ref={containerRef4} className="shrink-0" />
        </div>
      </div>

      <div className="w-xl mt-5">
        <b>Disaster-induced remittances received</b> in an <u>average year</u>
      </div>
      <div className="overflow-x-auto">
        <div className="flex">
          <div ref={containerRef5} className="shrink-0" />
          <div ref={containerRef6} className="shrink-0" />
        </div>
      </div>

      <div className="w-xl mt-5">
        <b>Disaster-induced remittances sent</b> in an <u>average year</u>
      </div>
      <div className="overflow-x-auto">
        <div className="flex">
          <div ref={containerRef7} className="shrink-0" />
          <div ref={containerRef8} className="shrink-0" />
        </div>
      </div>
    </div>
  );
};

function useGeoChart({ ref, data, r, rMax, fill, title, color, ...props }) {
  useEffect(() => {
    const plot = Plot.plot({
      title,
      projection: "equal-earth",
      width: 750,
      height: 400,
      color: {
        scheme: "viridis",
        reverse: true,
        legend: true,
        ...color,
      },
      r: {
        range: [0, rMax],
      },
      marks: [
        Plot.sphere({ fill: "white", stroke: colors.gray[200] }),
        Plot.geo(countriesGeo, {
          fill: colors.gray[200],
          stroke: "white",
          strokeWidth: 1,
        }),
        Plot.dot(data, {
          r,
          fill,
          x: "longitude",
          y: "latitude",
          strokeWidth: 1,
          stroke: colors.gray[500],
        }),
      ],
      ...props,
    });

    ref.current.append(plot);

    return () => plot.remove();
    // DEBUG:
  });
  // }, []);
}

export default GeoCharts;
