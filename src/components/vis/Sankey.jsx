import { useMemo, useState } from "react";
import {
  Sankey as SankeyImpl,
  sankeyCenter,
  sankeyRight,
  sankeyLeft,
  sankeyJustify,
  sankeyLinkHorizontal,
  sankey,
} from "@visx/sankey";
import { Group } from "@visx/group";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { motion } from "motion/react";
import PatternWavesAnimated from "@/components/vis/PatternWavesAnimated";
import { PatternLines, PatternCircles } from "@visx/pattern";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

const defaultMargin = { top: 10, left: 10, right: 10, bottom: 10 };

// TODO: Use patterns
// TODO: Apply textures !!!!!!!!!!!!!!!!
// TODO: Add gradient to the flow too?

const linkHorizontal = sankeyLinkHorizontal();

const Sankey = ({
  data,
  width,
  height,
  linkSource,
  linkTarget,
  linkValue,
  linkSort,
  linkFilter = (d) => true,
  colorScale,
  nodeWidth = 25,
  nodePadding = 20,
  nodeSort,
  nodeAlign = sankeyJustify,
  margin = defaultMargin,
  ...props
}) => {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip();
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const root = useMemo(() => {
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
      links: links.filter(linkFilter),
      // links: links.filter((d) => d.source === "Upper middle income-"),
      nodes: [...nodesSet].map((id) => ({ id })),
    };
  }, [data, linkSource, linkTarget, linkValue, linkFilter]);

  const graphs = useMemo(() => {
    const generator = sankey()
      .nodeId((d) => d.id)
      .nodeWidth(nodeWidth)
      .size([xMax, yMax])
      .nodePadding(nodePadding)
      .nodeAlign(nodeAlign)
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

    return {
      all: genGraph(),
      upperMiddle: genGraph((d) => d.source === "Upper middle income-"),
    };
  }, [root]);

  if (width < 10) return null;

  useGSAP(() => {
    if (!graphs) return;

    // console.log(gsap.utils.toArray("#sankey-income-links path"));

    console.log(graphs.upperMiddle);

    gsap
      .timeline()
      .to(
        "#sankey-income-links path",
        {
          attr: {
            d: (i) => {
              const path = linkHorizontal(graphs.upperMiddle.links[i]);
              return path;
            },
            "stroke-width": (i) => {
              return graphs.upperMiddle.links[i].width;
            },
          },
          duration: 3,
        },
        0,
      )
      .to(
        "#sankey-income-nodes rect",
        {
          attr: {
            width: (i) => {
              const { x1, x0 } = graphs.upperMiddle.nodes[i];
              return x1 - x0;
            },
            height: (i) => {
              const { y1, y0 } = graphs.upperMiddle.nodes[i];
              return y1 - y0;
            },
            x: (i) => {
              const { x0 } = graphs.upperMiddle.nodes[i];
              return x0;
            },
            y: (i) => {
              const { y0 } = graphs.upperMiddle.nodes[i];
              return y0;
            },
          },
          duration: 3,
        },
        0,
      );
  }, [graphs]);

  return (
    <div className="relative" {...props}>
      <svg width={width} height={height}>
        {/* Patterns */}
        {colorScale.domain().map((d, i) => {
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

        <g transform={`translate(${margin.left}, ${margin.top})`}>
          <g id="sankey-income-links">
            {graphs?.all.links.map((link, i) => (
              <motion.path
                key={i}
                d={linkHorizontal(link)}
                fill="transparent"
                // stroke={colorScale(link.source.id.slice(0, -1))}
                stroke={`url(#flow-pattern-${link.source.id.slice(0, -1).replace(/ /g, "-")})`}
                strokeWidth={link.width}
                opacity={0.4}
                // initial={{ pathLength: 0, opacity: 0 }}
                // animate={{ pathLength: 1, opacity: 0.5 }}
                // transition={{ duration: 0.8, ease: "easeOut" }}
                // whileHover={{ opacity: 0.8 }}
                onPointerMove={(event) => {
                  const coords = localPoint(
                    event.target.ownerSVGElement,
                    event,
                  );
                  showTooltip({
                    tooltipData: `${
                      link.source.id
                    } > ${link.target.id} = ${link.value}`,
                    tooltipTop: (coords?.y ?? 0) + 10,
                    tooltipLeft: (coords?.x ?? 0) + 10,
                  });
                }}
                onMouseOut={hideTooltip}
              />
            ))}
          </g>
          <g id="sankey-income-nodes">
            {graphs?.all.nodes.map(({ y0, y1, x0, x1, id }, i) => (
              <motion.rect
                key={i}
                width={x1 - x0}
                height={y1 - y0}
                x={x0}
                y={y0}
                rx={3}
                // fill={
                //   id.at(-1) === "-"
                //     ? colorScale(id.slice(0, -1))
                //     : colorScale(id)
                // }
                fill={`url(#node-pattern-${id.replace(/ /g, "-")})`}
                stroke="black"
                strokeWidth={2}
                // initial={{ opacity: 0 }}
                // animate={{ opacity: 1 }}
                // transition={{ delay: i * 0.05 }}
                // whileHover={{ opacity: 0.8 }}
                onPointerMove={(event) => {
                  const coords = localPoint(
                    event.target.ownerSVGElement,
                    event,
                  );
                  showTooltip({
                    tooltipData: id,
                    tooltipTop: (coords?.y ?? 0) + 10,
                    tooltipLeft: (coords?.x ?? 0) + 10,
                  });
                }}
                onMouseOut={hideTooltip}
              />
            ))}
          </g>
        </g>
      </svg>
      {tooltipOpen && (
        <TooltipWithBounds
          key={Math.random()}
          top={tooltipTop}
          left={tooltipLeft}
        >
          {tooltipData}
        </TooltipWithBounds>
      )}
    </div>
  );
};

export default Sankey;
