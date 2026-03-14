import Sankey from "@/components/vis/Sankey";
import { useMemo } from "react";
import { useRoomStore } from "@/store";

const SankeyIncome = ({ width, height }) => {
  const incomeColorScale = useRoomStore((s) => s.incomeColorScale);
  const flowsByIncome = useRoomStore((s) => s.flowsByIncome);

  const data = useMemo(() => {
    if (!flowsByIncome) return null;

    const filtered = flowsByIncome.filter((d) => d.year === 2019);

    return filtered;
  }, [flowsByIncome]);

  return (
    <>
      {data && (
        <Sankey
          data={data}
          nodes={incomeColorScale?.domain().map((d) => ({ id: d }))}
          width={width}
          height={height}
          linkSource={(d) => d.destination_group}
          linkTarget={(d) => d.origin_group}
          linkValue={(d) => d.sim_remittances_with}
          colorScale={incomeColorScale}
        />
      )}
    </>
  );
};

export default SankeyIncome;
