import { useMemo, useState } from "react";
import {
  Sankey as SankeyImpl,
  sankeyCenter,
  sankeyRight,
  sankeyLeft,
  sankeyJustify,
} from "@visx/sankey";
import { Group } from "@visx/group";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { motion } from "motion/react";
import PatternWavesAnimated from "@/components/vis/PatternWavesAnimated";
import { PatternLines, PatternCircles } from "@visx/pattern";

const defaultMargin = { top: 10, left: 10, right: 10, bottom: 10 };

// TODO: Use patterns
// TODO: Apply textures !!!!!!!!!!!!!!!!

const Sankey = ({
  data,
  width,
  height,
  linkSource,
  linkTarget,
  linkValue,
  linkSort,
  linkFilter = (d) => d,
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
      nodes: [...nodesSet].map((id) => ({ id })),
    };
  }, [data, linkSource, linkTarget, linkValue, linkFilter]);

  if (width < 10) return null;

  return (
    <div
      className="relative"
      style={
        {
          // padding: `${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px`,
        }
      }
      {...props}
    >
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
          <SankeyImpl
            root={root}
            nodeId={(d) => d.id}
            nodeWidth={nodeWidth}
            size={[xMax, yMax]}
            nodePadding={nodePadding}
            nodeAlign={nodeAlign}
            nodeSort={nodeSort}
            linkSort={linkSort}
            iterations={10}
          >
            {({ graph, createPath }) => (
              <>
                <Group>
                  {graph.links.map((link, i) => (
                    <motion.path
                      key={i}
                      d={createPath(link)}
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
                </Group>
                <Group>
                  {graph.nodes.map(({ y0, y1, x0, x1, id }, i) => (
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
                </Group>
              </>
            )}
          </SankeyImpl>
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
