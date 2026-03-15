import Sankey from "@/components/vis/Sankey";
import { useMemo } from "react";
import { useRoomStore } from "@/store";
import { sankey } from "@visx/sankey";

const linkSource = (d) => d.destination_income;
const linkTarget = (d) => d.origin_income;
const linkValue = (d) => d.sim_remittances_with;

const nodeWidth = 25;
const nodePadding = 20;

const defaultMargin = { top: 10, left: 10, right: 10, bottom: 10 };

const SankeyIncome = ({ width, height, margin = defaultMargin }) => {
  const incomeColorScale = useRoomStore((s) => s.incomeColorScale);
  const flowsByIncome = useRoomStore((s) => s.flowsByIncome);

  const setSankeyIncomeGraphs = useRoomStore((s) => s.setSankeyIncomeGraphs);

  const data = useMemo(() => {
    if (!flowsByIncome) return null;

    const filtered = flowsByIncome.filter((d) => d.year === 2019);

    return filtered;
  }, [flowsByIncome]);

  const { nodeSort, linkSort } = useMemo(() => {
    if (!incomeColorScale) return {};

    const groups = incomeColorScale.domain();

    const nodeOrder = [];

    groups.forEach((d) => {
      nodeOrder.push(d);
      nodeOrder.push(`${d}-`);
    });

    const nodeSort = (a, b) => {
      return nodeOrder.indexOf(a.id) - nodeOrder.indexOf(b.id);
    };
    const linkSort = (a, b) => {
      return nodeOrder.indexOf(a.target.id) - nodeOrder.indexOf(b.target.id);
    };

    return { nodeSort, linkSort };
  }, [incomeColorScale]);

  const root = useMemo(() => {
    if (!data) return null;

    const nodesSet = new Set();

    const links = [];

    data.forEach((l) => {
      // const s = sourceRename ? `${source(l)} ${sourceRename}` : source(l);
      const s = `${linkSource(l)}-`;
      const t = linkTarget(l);

      nodesSet.add(s);
      nodesSet.add(t);

      links.push({
        source: s,
        target: t,
        value: linkValue(l),
      });
    });

    return {
      links: links,
      // links: links.filter((d) => d.source === "Upper middle income-"),
      nodes: [...nodesSet].map((id) => ({ id })),
    };
  }, [data]);

  const graphs = useMemo(() => {
    if (!root) return null;

    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;

    const generator = sankey()
      .nodeId((d) => d.id)
      .nodeWidth(nodeWidth)
      .size([xMax, yMax])
      .nodePadding(nodePadding)
      .nodeSort(nodeSort)
      .linkSort(linkSort);

    function genGraph(filter) {
      const nodesCopy = root.nodes.map((d) => ({ ...d }));

      const linksCopy = root.links.map((d) => {
        const newD = { ...d };
        if (filter) {
          if (!filter(d)) {
            newD.value = 0;
          }
        }

        return newD;
      });

      const graph = generator({
        nodes: nodesCopy,
        links: linksCopy,
      });

      return graph;
    }

    const graphs = {
      all: genGraph(),
      upperMiddle: genGraph((d) => d.source === "Upper middle income-"),
    };

    setSankeyIncomeGraphs(graphs);

    return graphs;
  }, [root, nodeSort, linkSort]);

  return (
    <>
      {graphs && incomeColorScale && (
        <div>
          <Sankey
            graph={graphs.all}
            width={width}
            height={height}
            colorScale={incomeColorScale}
            margin={margin}
          />
        </div>
      )}
    </>
  );
};

export default SankeyIncome;
