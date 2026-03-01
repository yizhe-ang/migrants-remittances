import { useRoomStore } from "@/store";
import { useSql } from "@sqlrooms/duckdb";
import SankeyCharts from "./SankeyCharts";
import GeoCharts from "./GeoCharts";
import DisastersCharts from "./DisastersCharts";

const Notebook = () => {
  const migAndRemAvgYearReady = useRoomStore((state) =>
    state.db.findTableByName("mig_and_rem_avg_year"),
  );
  const disastersReady = useRoomStore((state) =>
    state.db.findTableByName("disasters"),
  );
  const disastersImpactsReady = useRoomStore((state) =>
    state.db.findTableByName("disasters_impacts"),
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
      SELECT
        sum(floods) AS floods,
        sum(storms) AS storms,
        sum(droughts) AS droughts,
        sum(earthquakes) AS earthquakes,

      FROM disasters_impacts

      GROUP BY "date"
    `,
    enabled: Boolean(disastersImpactsReady),
  });

  const { data: migAndRemByIncome } = useSql({
    query: /* sql */ `
      -- Group by income level
      SELECT
        origin_group,
        destination_group,

        sum(n_migrants) AS n_migrants,
        sum(sim_remittances_with) AS sim_remittances_with,
        sum(sim_remittances_without) AS sim_remittances_without,
        sum(disaster_remittances) AS disaster_remittances,

      FROM mig_and_rem_avg_year

      GROUP BY (origin_group, destination_group)
    `,
    enabled: Boolean(migAndRemAvgYearReady),
  });

  const { data: migAndRemByDestination } = useSql({
    query: migAndRemByCountryQuery("destination"),
    enabled: Boolean(migAndRemAvgYearReady),
  });

  const { data: migAndRemByOrigin } = useSql({
    query: migAndRemByCountryQuery("origin"),
    enabled: Boolean(migAndRemAvgYearReady),
  });

  return (
    <div className="w-full h-full overflow-y-scroll pt-5">
      <div className="text-sm w-xl mx-auto">
        Our estimates show that, between 2010 and 2019, international remittance
        flows across the globe totaled 6.1 trillion USD. This sum is equivalent
        to 0.78% of the global GDP produced over the same time period
      </div>

      <div className="w-xl mx-auto mt-5">
        <span className="font-bold">Remittance flows</span> across the globe,
        between <span className="underline">2010 to 2019</span>
      </div>
      <div className="mt-2">
        <img src="/notebook/flow-map-1.png" />
      </div>

      {migAndRemByIncome && migAndRemAvgYear && (
        <SankeyCharts
          migAndRemByIncome={migAndRemByIncome.toArray()}
          migAndRemAvgYear={migAndRemAvgYear.toArray()}
        />
      )}

      {migAndRemByOrigin && <GeoCharts data={migAndRemByOrigin.toArray()} />}

      {disasters && disastersImpacts && (
        <DisastersCharts
          disasters={disasters}
          disastersImpacts={disastersImpacts}
        />
      )}

      <div className="h-screen" />
    </div>
  );
};

// FIXME: Have to fix per capita computation
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

      FROM mig_and_rem_avg_year

      GROUP BY (${group})
    )

    SELECT
      *,
      countries_geo.latitude,
      countries_geo.longitude,

    FROM step1

    LEFT JOIN countries_geo
    ON step1.${group} = countries_geo.country
  `;
}

export default Notebook;
