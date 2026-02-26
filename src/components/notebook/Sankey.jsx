import { useMemo } from "react";
import { ResponsiveSankey } from "@nivo/sankey";

const Sankey = ({ data }) => {
  const source = (d) => d.destination_group;
  const target = (d) => d.origin_group;
  const value = (d) => d.sim_remittances_with;

  const { nodes, links } = useMemo(() => {
    const nodesSet = new Set();

    const links = [];

    for (const l of data.rows()) {
      const s = `${source(l)} ->`;
      const t = target(l);

      nodesSet.add(s);
      nodesSet.add(t);

      links.push({
        source: s,
        target: t,
        value: value(l),
      });
    }

    return {
      links,
      nodes: [...nodesSet].map((id) => ({ id })),
    };
  }, [data]);

  return (
    <div className="flex flex-col items-center gap-4 w-full h-full">
      <div className="h-[500px] w-[500px]">
        <ResponsiveSankey data={{ nodes, links }} margin={{
          top: 10,
          bottom: 10,
        }} enableLinkGradient={true} />
      </div>
    </div>
  );
};

export default Sankey;
