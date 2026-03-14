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

const defaultMargin = { top: 10, left: 10, right: 10, bottom: 10 };

// TODO: Use patterns

const Sankey = ({
  data,
  width,
  height,
  linkSource,
  linkTarget,
  linkValue,
  linkSort,
  colorScale,
  nodeWidth = 20,
  nodePadding = 10,
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
      links,
      nodes: [...nodesSet].map((id) => ({ id })),
    };
  }, [data, linkSource, linkTarget, linkValue]);

  if (width < 10) return null;

  return (
    <div
      className="relative"
      style={{
        padding: `${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px`,
      }}
      {...props}
    >
      <svg width={xMax} height={yMax}>
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
                    stroke={colorScale(link.source.id.slice(0, -1))}
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
                    fill={
                      id.at(-1) === "-"
                        ? colorScale(id.slice(0, -1))
                        : colorScale(id)
                    }
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
