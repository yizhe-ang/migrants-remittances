import { useRoomStore } from "@/store";
import { useSql } from "@sqlrooms/duckdb";
import { useMemo } from "react";

export default function useDataProcessing() {
  const migAndRemAvgYearReady = useRoomStore((state) =>
    state.db.findTableByName("mig_and_rem_avg_year"),
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

  const { data: migAndRemAvgYear } = useSql({
    query: /* sql */ `
      SELECT *
      FROM mig_and_rem_avg_year
    `,
    enabled: Boolean(migAndRemAvgYearReady),
  });

  const { data: disasters } = useSql({
    query: /* sql */ `
      SELECT *
      FROM disasters
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

  const { data: countriesGeo } = useSql({
    query: /* sql */ `
      SELECT *
      FROM countries_geo
    `,
    enabled: Boolean(countriesGeoReady),
  });

  const countriesGeoMap = useMemo(() => {
    if (!countriesGeo) return;

    const map = new Map();

    for (const d of countriesGeo.rows()) {
      map.set(d.country, {
        latitude: d.latitude,
        longitude: d.longitude,
      });
    }

    return map;
  }, [countriesGeo]);

  return {
    migAndRemAvgYear,
    disasters,
    disastersImpactsByMonth,
    migAndRemByIncome,
    migAndRemByRegion,
    migAndRemByDestination,
    migAndRemByOrigin,
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
