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

  // FIXME: Does this rerun all other useSql?
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
          sum(n_migrants) AS n_migrants,
          sum(sim_remittances_with) AS sim_remittances_with,
          sum(sim_remittances_without) AS sim_remittances_without,
          sum(disaster_remittances) AS disaster_remittances,
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

      -- Grab income group information
      SELECT
        a.*,
        b.group AS origin_group,
        c.group AS destination_group

      FROM step2 a

      LEFT JOIN countries_stats b
      ON a.origin = b.country

      LEFT JOIN countries_stats c
      ON a.destination = c.country
    `,

    enabled: Boolean(migAndRemDerivedReady) && Boolean(countriesStatsReady),
  });

  useEffect(() => {
    if (migAndRemAvgYearReady) {
      refreshTableSchemas();
    }
  }, [migAndRemAvgYearReady]);
}
