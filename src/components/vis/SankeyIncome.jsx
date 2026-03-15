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

  const nodeOrder = useMemo(() => {
    if (!incomeColorScale) return null;

    const groups = incomeColorScale.domain();

    const nodeOrder = [];

    groups.forEach((d) => {
      nodeOrder.push(d);
      nodeOrder.push(`${d}-`);
    });

    return nodeOrder;
  }, [incomeColorScale]);

  return (
    <>
      {data && nodeOrder && (
        <Sankey
          data={data}
          width={width}
          height={height}
          linkSource={(d) => d.destination_income}
          linkTarget={(d) => d.origin_income}
          linkValue={(d) => d.sim_remittances_with}
          colorScale={incomeColorScale}
          nodeSort={(a, b) => {
            return nodeOrder.indexOf(a.id) - nodeOrder.indexOf(b.id);
          }}
          linkSort={(a, b) => {
            return (
              nodeOrder.indexOf(a.target.id) - nodeOrder.indexOf(b.target.id)
            );
          }}
        />
      )}
    </>
  );
};

export default SankeyIncome;
