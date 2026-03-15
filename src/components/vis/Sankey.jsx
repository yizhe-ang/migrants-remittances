import { sankeyLinkHorizontal } from "@visx/sankey";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { motion } from "motion/react";
import PatternWavesAnimated from "@/components/vis/PatternWavesAnimated";
import { PatternLines, PatternCircles } from "@visx/pattern";

// TODO: Use patterns
// TODO: Apply textures !!!!!!!!!!!!!!!!
// TODO: Add gradient to the flow too?

const linkHorizontal = sankeyLinkHorizontal();

const linkOpacity = 0.3;

const Sankey = ({ graph, width, height, colorScale, margin, ...props }) => {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip();

  if (width < 10) return null;

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
          <g className="sankey-links">
            {graph.links.map((link, i) => (
              <motion.path
                key={i}
                d={linkHorizontal(link)}
                fill="transparent"
                // stroke={colorScale(link.source.id.slice(0, -1))}
                stroke={`url(#flow-pattern-${link.source.id.slice(0, -1).replace(/ /g, "-")})`}
                strokeWidth={link.width}
                opacity={linkOpacity}
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
          <g className="sankey-nodes">
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
