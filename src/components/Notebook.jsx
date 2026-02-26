import { useRoomStore } from "@/store";
import { useSql } from "@sqlrooms/duckdb";

const Notebook = () => {
  const tableReady = useRoomStore((state) =>
    state.db.findTableByName("mig_and_rem_avg_year"),
  );

  const { data } = useSql({
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

  console.log(data);

  return <div></div>;
};

export default Notebook;
