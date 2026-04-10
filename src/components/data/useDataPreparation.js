import { useRoomStore } from "@/store";
import { useSql } from "@sqlrooms/duckdb";
import { useEffect } from "react";

export default function useDataPreparation() {
  const refreshTableSchemas = useRoomStore(
    (state) => state.db.refreshTableSchemas,
  );
  const setDataSourcesReady = useRoomStore(
    (state) => state.setDataSourcesReady,
  );

  const migAndRemReady = useRoomStore((state) => state.db.findTableByName("mig_and_rem"));
  const countriesStatsReady = useRoomStore((state) => state.db.findTableByName("countries_stats"));
  const allDataSourcesReady = useRoomStore((state) =>
    [
      "countries_geo",
      "countries_stats",
      "disasters_impacts",
      "mig_and_rem",
      "rem_panel",
      "disasters",
    ].every((tableName) => Boolean(state.db.findTableByName(tableName))),
  );

  useEffect(() => {
    if (allDataSourcesReady) {
      setDataSourcesReady(true);
    }
  }, [allDataSourcesReady, setDataSourcesReady]);

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

  const { data: flowsPerYearReady } = useSql({
    query: /* sql */ `
      CREATE OR REPLACE VIEW flows_per_year AS

      WITH step_1 AS (
        SELECT
          EXTRACT('year' FROM date)::INTEGER AS year,
          origin,
          destination,
          sum(sim_remittances_with) AS sim_remittances_with

        FROM mig_and_rem_derived

        GROUP BY (year, origin, destination)
      )

      SELECT
        a.*,

        b.gdp * b.population AS origin_gdp,
        c.gdp * c.population AS destination_gdp,

        a.sim_remittances_with / origin_gdp AS origin_prop_of_gdp,
        a.sim_remittances_with / destination_gdp AS destination_prop_of_gdp,

      FROM step_1 a

      LEFT JOIN countries_stats b
        ON a.origin = b.country
          AND a.year = b.year

      LEFT JOIN countries_stats c
        ON a.destination = c.country
          AND a.year = c.year
    `,
    enabled: Boolean(migAndRemDerivedReady),
  });

  useEffect(() => {
    if (flowsPerYearReady) {
      refreshTableSchemas();
    }
  }, [flowsPerYearReady]);
}
