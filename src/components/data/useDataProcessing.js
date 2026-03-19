import { useRoomStore } from "@/store";
import { useSql } from "@sqlrooms/duckdb";
import { index } from "d3-array";
import { useEffect } from "react";

export default function useDataProcessing() {
  const selectedYear = useRoomStore((state) => state.selectedYear);

  const setCountriesGeo = useRoomStore((state) => state.setCountriesGeo);
  const setCountriesGeoMap = useRoomStore((state) => state.setCountriesGeoMap);
  const setCountriesAggStatsMap = useRoomStore(
    (state) => state.setCountriesAggStatsMap,
  );
  const setFlowsPerYear = useRoomStore((state) => state.setFlowsPerYear);
  const setSelectedFlows = useRoomStore((state) => state.setSelectedFlows);
  const setFlowsByIncome = useRoomStore((state) => state.setFlowsByIncome);
  const setFlowsByOrigin = useRoomStore((state) => state.setFlowsByOrigin);
  const setFlowsByDestination = useRoomStore(
    (state) => state.setFlowsByDestination,
  );
  const setFlowsMap = useRoomStore((state) => state.setFlowsMap);
  const setFlowsMap2019 = useRoomStore((state) => state.setFlowsMap2019);
  const setDisasters = useRoomStore((state) => state.setDisasters);
  const setDisastersImpactsByMonth = useRoomStore(
    (state) => state.setDisastersImpactsByMonth,
  );

  const flowsPerYearStore = useRoomStore((state) => state.flowsPerYear);

  const flowsPerYearReady = useRoomStore((state) =>
    state.db.findTableByName("flows_per_year"),
  );
  const countriesGeoReady = useRoomStore((state) =>
    state.db.findTableByName("countries_geo"),
  );
  const countriesStatsReady = useRoomStore((state) =>
    state.db.findTableByName("countries_stats"),
  );
  const countriesAggStatsReady = useRoomStore((state) =>
    state.db.findTableByName("countries_agg_stats"),
  );
  const disastersReady = useRoomStore((state) =>
    state.db.findTableByName("disasters"),
  );
  const disastersImpactsReady = useRoomStore((state) =>
    state.db.findTableByName("disasters_impacts"),
  );

  const { data: countriesStats } = useSql({
    query: /* sql */ `
      SELECT
        * EXCLUDE(year),
        year::INTEGER AS year
      FROM countries_stats
    `,
    enabled: Boolean(countriesStatsReady),
  });

  const { data: flowsPerYear } = useSql({
    query: /* sql */ `
      SELECT *
      FROM flows_per_year
    `,
    enabled: Boolean(flowsPerYearReady),
  });
  useEffect(() => {
    if (!flowsPerYear) return;

    setFlowsPerYear(flowsPerYear.toArray());
  }, [flowsPerYear]);

  useEffect(() => {
    if (!flowsPerYearStore) return;

    const selectedFlows = flowsPerYearStore.filter(
      (d) => d.year === selectedYear,
    );
    setSelectedFlows(selectedFlows);

    const flowsByOriginMap = new Map();
    const flowsByDestinationMap = new Map();

    selectedFlows.forEach((flow, idx) => {
      if (!flowsByOriginMap.has(flow.origin))
        flowsByOriginMap.set(flow.origin, []);
      flowsByOriginMap.get(flow.origin).push({
        flow,
        idx,
      });

      if (!flowsByDestinationMap.has(flow.destination))
        flowsByDestinationMap.set(flow.destination, []);
      flowsByDestinationMap.get(flow.destination).push({
        flow,
        idx,
      });
    });

    setFlowsMap(
      new Map([
        ["origin", flowsByOriginMap],
        ["destination", flowsByDestinationMap],
      ]),
    );
  }, [flowsPerYearStore, selectedYear]);

  useEffect(() => {
    if (!flowsPerYearStore) return;

    const selectedFlows = flowsPerYearStore.filter((d) => d.year === 2019);

    const flowsByOriginMap = new Map();
    const flowsByDestinationMap = new Map();

    selectedFlows.forEach((flow, idx) => {
      if (!flowsByOriginMap.has(flow.origin))
        flowsByOriginMap.set(flow.origin, []);
      flowsByOriginMap.get(flow.origin).push({
        flow,
        idx,
      });

      if (!flowsByDestinationMap.has(flow.destination))
        flowsByDestinationMap.set(flow.destination, []);
      flowsByDestinationMap.get(flow.destination).push({
        flow,
        idx,
      });
    });

    setFlowsMap2019(
      new Map([
        ["origin", flowsByOriginMap],
        ["destination", flowsByDestinationMap],
      ]),
    );
  }, [flowsPerYearStore]);

  const { data: flowsByIncome } = useSql({
    query: /* sql */ `
      WITH step_1 AS (
        SELECT
          a.*,
          b.group AS origin_income,
          c.group AS destination_income

        FROM flows_per_year a

        LEFT JOIN countries_stats b
          ON a.origin = b.country
            AND a.year = b.year

        LEFT JOIN countries_stats c
          ON a.destination = c.country
            AND a.year = c.year
      )

      SELECT
        year,
        origin_income,
        destination_income,

        sum(sim_remittances_with) AS sim_remittances_with

      FROM step_1

      GROUP BY (year, origin_income, destination_income)
    `,
    enabled: Boolean(flowsPerYearReady),
  });

  useEffect(() => {
    if (!flowsByIncome) return;

    setFlowsByIncome(flowsByIncome.toArray());
  }, [flowsByIncome]);

  const { data: flowsByOrigin } = useSql({
    query: flowsByCountryQuery("origin"),
    enabled: Boolean(flowsPerYearReady),
  });
  useEffect(() => {
    if (!flowsByOrigin) return;

    setFlowsByOrigin(flowsByOrigin.toArray());
  }, [flowsByOrigin]);

  const { data: flowsByDestination } = useSql({
    query: flowsByCountryQuery("destination"),
    enabled: Boolean(flowsPerYearReady),
  });
  useEffect(() => {
    if (!flowsByDestination) return;

    setFlowsByDestination(flowsByDestination.toArray());
  }, [flowsByDestination]);

  const { data: countriesGeo } = useSql({
    query: /* sql */ `
      SELECT *
      FROM countries_geo
    `,
    enabled: Boolean(countriesGeoReady),
  });

  useEffect(() => {
    if (!countriesGeo) return;

    setCountriesGeo(countriesGeo.toArray());
  }, [countriesGeo]);

  useEffect(() => {
    if (!countriesGeo) return;

    const countriesGeoMap = index(countriesGeo.toArray(), (d) => d.country);

    setCountriesGeoMap(countriesGeoMap);
  }, [countriesGeo]);

  const { data: countriesAggStats } = useSql({
    query: /* sql */ `
      SELECT *
      FROM countries_agg_stats
    `,
    enabled: Boolean(countriesAggStatsReady),
  });

  useEffect(() => {
    if (!countriesAggStats) return;

    const countriesAggStatsMap = index(countriesAggStats, (d) => d.country);

    setCountriesAggStatsMap(countriesAggStatsMap);
  }, [countriesAggStats]);

  const { data: disasters } = useSql({
    query: /* sql */ `
      SELECT
        a.*,
        b.latitude,
        b.longitude

      FROM disasters a

      LEFT JOIN countries_geo b
        ON a.country = b.country
    `,
    enabled: Boolean(disastersReady) && Boolean(countriesGeoReady),
  });

  useEffect(() => {
    if (!disasters) return;

    setDisasters(
      disasters.toArray().map((d) => {
        return {
          ...d,
          start_date: new Date(d.start_date),
          end_date: new Date(d.end_date),
        };
      }),
    );
  }, [disasters]);

  const { data: disastersImpactsByMonth } = useSql({
    query: /* sql */ `
      WITH step1 AS (
        SELECT
          date,
          sum(floods) AS floods,
          sum(storms) AS storms,
          sum(droughts) AS droughts,
          sum(earthquakes) AS earthquakes

        FROM disasters_impacts

        GROUP BY "date"
      )

      UNPIVOT step1
      ON floods, storms, droughts, earthquakes
      INTO
        NAME disaster_type
        VALUE remittance
    `,
    enabled: Boolean(disastersImpactsReady),
  });

  useEffect(() => {
    if (!disastersImpactsByMonth) return;

    setDisastersImpactsByMonth(
      disastersImpactsByMonth.toArray().map((d) => {
        return {
          ...d,
          date: new Date(d.date),
        };
      }),
    );
  }, [disastersImpactsByMonth]);
}

function flowsByCountryQuery(group) {
  return /* sql */ `
    WITH step_1 AS (
      SELECT
        ${group},
        year,
        sum(sim_remittances_with) AS sim_remittances_with

      FROM flows_per_year

      GROUP BY (year, ${group})
    )

    SELECT
      a.*,
      -- (s.gdp * s.population) AS gdp,
      a.sim_remittances_with / (s.gdp * s.population) AS prop_of_gdp,
      s.group AS income

    FROM step_1 a

    LEFT JOIN countries_stats s
    ON a.${group} = s.country
      AND a.year = s.year

    -- FIXME: Why is Yemen missing?
    -- WHERE prop_of_gdp IS NOT NULL
  `;
}
