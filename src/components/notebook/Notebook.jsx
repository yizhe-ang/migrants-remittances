import { useRoomStore } from "@/store";
import { useSql } from "@sqlrooms/duckdb";
import Sankey from "./Sankey";

const Notebook = () => {
  const tableReady = useRoomStore((state) =>
    state.db.findTableByName("mig_and_rem_avg_year"),
  );

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
    enabled: Boolean(tableReady),
  });

  return (
    <div className="w-full h-full overflow-y-scroll">
      {migAndRemByIncome && <Sankey data={migAndRemByIncome} />}
    </div>
  );
};

export default Notebook;
