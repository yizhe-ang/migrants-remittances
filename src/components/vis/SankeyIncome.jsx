import Sankey from "@/components/vis/Sankey";
import { useMemo, useEffect } from "react";
import { useRoomStore } from "@/store";
import { sankey } from "@visx/sankey";
import PatternWavesAnimated from "@/components/vis/PatternWavesAnimated";
import { PatternLines, PatternCircles } from "@visx/pattern";

const linkSource = (d) => d.destination_income;
const linkTarget = (d) => d.origin_income;
const linkValue = (d) => d.sim_remittances_with;

const nodeWidth = 25;
const nodePadding = 20;

const defaultMargin = { top: 40, left: 70, right: 70, bottom: 10 };

const SankeyIncome = ({ width, height, margin = defaultMargin }) => {
  const incomeColorScale = useRoomStore((s) => s.incomeColorScale);
  const flowsByIncome = useRoomStore((s) => s.flowsByIncome);

  const colorScale = incomeColorScale

  const setSankeyIncome = useRoomStore((s) => s.setSankeyIncome);

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
      lowerMiddle: genGraph((d) => d.source === "Lower middle income-"),
      low: genGraph((d) => d.source === "Low income-"),
      // test: genGraph((d) => d.source !== "High income-"),
      // TODO: Compute % of gdp
    };

    return graphs;
  }, [root, nodeSort, linkSort]);

  useEffect(() => {
    if (graphs) {
      setSankeyIncome({ graphs, width });
    }
  }, [graphs, setSankeyIncome]);

  return (
    <>
      {graphs && colorScale && (
        <div
          className="flex gap-10"
          style={{
            transform: `translate(calc(50vw - ${width / 2}px), ${0}px)`,
            // opacity: 0,
            // visibility: "hidden",
          }}
          id="sankey-income"
        >
          <svg>
            {/* Patterns */}
            {incomeColorScale.domain().map((d, i) => {
              const idName = d.replace(/ /g, "-");

              return (
                <g key={d}>
                  <PatternWavesAnimated
                    id={`flow-pattern-${idName}`}
                    background={colorScale(d)}
                  />
                  <PatternLines
                    id={`node-pattern-${idName}-`}
                    height={15}
                    width={15}
                    stroke="white"
                    strokeWidth={1}
                    orientation={["diagonal"]}
                    background={colorScale(d)}
                  />
                  <PatternCircles
                    id={`node-pattern-${idName}`}
                    height={15}
                    width={15}
                    radius={2}
                    fill="white"
                    complement
                    background={colorScale(d)}
                  />
                </g>
              );
            })}
          </svg>
          {/* <Sankey
            graph={graphs.test}
            width={width}
            height={height}
            colorScale={incomeColorScale}
            margin={margin}
            id="sankey-income-all"
            style={{
              opacity: 1,
              visibility: "visible",
            }}
          /> */}
          <Sankey
            graph={graphs.all}
            width={width}
            height={height}
            colorScale={incomeColorScale}
            margin={margin}
            id="sankey-income-all"
          />
          <Sankey
            graph={graphs.lowerMiddle}
            width={width}
            height={height}
            colorScale={incomeColorScale}
            margin={margin}
            id="sankey-income-lower-middle"
          />
          <Sankey
            graph={graphs.low}
            width={width}
            height={height}
            colorScale={incomeColorScale}
            margin={margin}
            id="sankey-income-low"
          />
        </div>
      )}
    </>
  );
};

export default SankeyIncome;
