import { useRoomStore } from "@/store";
import { useSql } from "@sqlrooms/duckdb";
import { index } from "d3-array";
import { useEffect, useMemo } from "react";

export default function useDataProcessing() {
  const setCountriesGeo = useRoomStore((state) => state.setCountriesGeo);
  const setCountriesGeoMap = useRoomStore((state) => state.setCountriesGeoMap);
  const setCountriesAggStatsMap = useRoomStore(
    (state) => state.setCountriesAggStatsMap,
  );
  const setFlowsByOrigin = useRoomStore((state) => state.setFlowsByOrigin);
  const setFlowsByDestination = useRoomStore(
    (state) => state.setFlowsByDestination,
  );

  const migAndRemAvgYearReady = useRoomStore((state) =>
    state.db.findTableByName("mig_and_rem_avg_year"),
  );
  const flowsPerYearReady = useRoomStore((state) =>
    state.db.findTableByName("flows_per_year"),
  );
  const disastersReady = useRoomStore((state) =>
    state.db.findTableByName("disasters"),
  );
  const disastersImpactsReady = useRoomStore((state) =>
    state.db.findTableByName("disasters_impacts"),
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

  const { data: migAndRemAvgYear } = useSql({
    query: /* sql */ `
      SELECT *
      FROM mig_and_rem_avg_year
    `,
    enabled: Boolean(migAndRemAvgYearReady),
  });

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

  const { data: disastersByCountry } = useSql({
    query: /* sql */ `
      WITH step_1 AS (
        SELECT
          country,
          disaster_type,
          SUM(affected) AS affected,

        FROM disasters

        GROUP BY country, disaster_type
      ),

      step_2 AS (
        PIVOT step_1
        ON disaster_type
        USING COALESCE(SUM(affected), 0)
        GROUP BY country
      )

      SELECT
        *,
        (drought + earthquake + flood + storm) AS affected,

      FROM step_2
    `,
    enabled: Boolean(disastersReady),
  });

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

  const { data: migAndRemByIncome } = useSql({
    query: migAndRemByGroupQuery("group"),
    enabled: Boolean(migAndRemAvgYearReady),
  });

  const { data: migAndRemByRegion } = useSql({
    query: migAndRemByGroupQuery("region"),
    enabled: Boolean(migAndRemAvgYearReady),
  });

  // FIXME: Is the computation correct?
  const { data: migAndRemByDestination } = useSql({
    query: migAndRemByCountryQuery("destination"),
    enabled: Boolean(migAndRemAvgYearReady),
  });

  const { data: migAndRemByOrigin } = useSql({
    query: migAndRemByCountryQuery("origin"),
    enabled: Boolean(migAndRemAvgYearReady),
  });

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

  return {
    migAndRemAvgYear,
    flowsPerYear,
    disasters,
    disastersImpactsByMonth,
    disastersByCountry,
    migAndRemByIncome,
    migAndRemByRegion,
    migAndRemByDestination,
    migAndRemByOrigin,
    flowsByOrigin,
    countriesStats,
  };
}

function migAndRemByCountryQuery(group) {
  return /* sql */ `
    WITH step1 AS (

    SELECT
      ${group},

      sum(sim_remittances_with) AS sim_remittances_with,
      sum(sim_remittances_without) AS sim_remittances_without,
      sum(disaster_remittances) AS disaster_remittances,

      avg(sim_remittances_with_per_capita) AS sim_remittances_with_per_capita,
      avg(sim_remittances_without_per_capita) AS sim_remittances_without_per_capita,
      avg(disaster_remittances_per_capita) AS disaster_remittances_per_capita,

      first(${group}_group) AS group,

      FROM mig_and_rem_avg_year

      GROUP BY (${group})
    )

    SELECT
      step1.*,
      latitude,
      longitude,

    FROM step1

    LEFT JOIN countries_geo
    ON step1.${group} = countries_geo.country
  `;
}

function migAndRemByGroupQuery(group) {
  return /* sql */ `
    SELECT
      origin_${group},
      destination_${group},

      sum(n_migrants) AS n_migrants,
      sum(sim_remittances_with) AS sim_remittances_with,
      sum(sim_remittances_without) AS sim_remittances_without,
      sum(disaster_remittances) AS disaster_remittances,

    FROM mig_and_rem_avg_year

    GROUP BY (origin_${group}, destination_${group})
  `;
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

      -- g.longitude,
      -- g.latitude

    FROM step_1 a

    LEFT JOIN countries_stats s
    ON a.${group} = s.country
      AND a.year = s.year

    -- LEFT JOIN countries_geo g
      -- ON a.${group} = g.country

    WHERE prop_of_gdp IS NOT NULL
  `;
}
