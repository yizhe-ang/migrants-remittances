import { useRoomStore } from "@/store";
import { useSql } from "@sqlrooms/duckdb";
import { useEffect } from "react";

export default function useDataPreparation() {
  const refreshTableSchemas = useRoomStore(
    (state) => state.db.refreshTableSchemas,
  );

  const migAndRemReady = useRoomStore((state) =>
    state.db.findTableByName("mig_and_rem"),
  );
  const countriesStatsReady = useRoomStore((state) =>
    state.db.findTableByName("countries_stats"),
  );

  // Computing derived columns
  const { data: migAndRemDerivedReady } = useSql({
    query: /* sql */ `
      CREATE OR REPLACE VIEW mig_and_rem_derived AS

      SELECT
        *,
        sim_remittances_with / n_migrants AS sim_remittances_with_per_capita,
        sim_remittances_without / n_migrants AS sim_remittances_without_per_capita,
        disaster_remittances / n_migrants AS disaster_remittances_per_capita,

      FROM mig_and_rem
    `,

    enabled: Boolean(migAndRemReady),
  });

  const { data: countriesAggStatsReady } = useSql({
    query: /* sql */ `
      CREATE OR REPLACE VIEW countries_agg_stats AS

      SELECT
        country,
        last("group" ORDER BY year) AS group,
        -- Should I just take the latest GDP?
        avg(gdp) AS gdp,
        first(region) AS region,

      FROM countries_stats

      GROUP BY country
    `,

    enabled: Boolean(countriesStatsReady),
  });

  useEffect(() => {
    if (countriesAggStatsReady) {
      refreshTableSchemas();
    }
  }, [countriesAggStatsReady]);

  // FIXME: Have to fix per capita computation
  // Flows for an average year (aggregation)
  const { data: migAndRemAvgYearReady } = useSql({
    query: /* sql */ `
      CREATE OR REPLACE VIEW mig_and_rem_avg_year AS

      WITH step1 AS (
        -- Sum up months within each year
        SELECT
          EXTRACT('year' FROM date) AS year,
          origin,
          destination,
          -- It doesn't make sense to sum up n_migrants? More like take avg
          sum(n_migrants) AS n_migrants,
          sum(sim_remittances_with) AS sim_remittances_with,
          sum(sim_remittances_without) AS sim_remittances_without,
          sum(disaster_remittances) AS disaster_remittances,

          -- In a single year, a single person remits $ from A to B.
          sum(sim_remittances_with_per_capita) AS sim_remittances_with_per_capita,
          sum(sim_remittances_without_per_capita) AS sim_remittances_without_per_capita,
          sum(disaster_remittances_per_capita) AS disaster_remittances_per_capita,

        FROM mig_and_rem_derived

        GROUP BY (origin, destination, year)
      ),

      step2 AS (
        -- Get average year
        SELECT
          origin,
          destination,
          avg(n_migrants) AS n_migrants,
          avg(sim_remittances_with) AS sim_remittances_with,
          avg(sim_remittances_without) AS sim_remittances_without,
          avg(disaster_remittances) AS disaster_remittances,
          avg(sim_remittances_with_per_capita) AS sim_remittances_with_per_capita,
          avg(sim_remittances_without_per_capita) AS sim_remittances_without_per_capita,
          avg(disaster_remittances_per_capita) AS disaster_remittances_per_capita,

        FROM step1

        GROUP BY (origin, destination)
      )

      -- TODO: Just perform all the joining here
      -- Grab income group information
      SELECT
        a.*,

        b.group AS origin_group,
        c.group AS destination_group,

        b.region AS origin_region,
        c.region AS destination_region,

        b.gdp AS origin_gdp,
        c.gdp AS destination_gdp

      FROM step2 a

      LEFT JOIN countries_agg_stats b
      ON a.origin = b.country

      LEFT JOIN countries_agg_stats c
      ON a.destination = c.country
    `,

    enabled: Boolean(migAndRemDerivedReady) && Boolean(countriesAggStatsReady),
  });

  useEffect(() => {
    if (migAndRemAvgYearReady) {
      refreshTableSchemas();
    }
  }, [migAndRemAvgYearReady]);

  const { data: flowsPerYearReady } = useSql({
    query: /* sql */ `
      CREATE OR REPLACE VIEW flows_per_year AS

      SELECT
        EXTRACT('year' FROM date)::INTEGER AS year,
        origin,
        destination,
        sum(sim_remittances_with) AS sim_remittances_with

      FROM mig_and_rem_derived

      GROUP BY (year, origin, destination)
    `,
    enabled: Boolean(migAndRemDerivedReady),
  });

  useEffect(() => {
    if (flowsPerYearReady) {
      refreshTableSchemas();
    }
  }, [flowsPerYearReady]);
}
