import { useMemo, useState } from "react";
import {
  Sankey as SankeyImpl,
  sankeyCenter,
  sankeyRight,
  sankeyLeft,
  sankeyJustify,
} from "@visx/sankey";
import { Group } from "@visx/group";
import { BarRounded, LinkHorizontal } from "@visx/shape";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { localPoint } from "@visx/event";

const defaultMargin = { top: 10, left: 10, right: 10, bottom: 10 };

const Sankey = ({
  data,
  nodes,
  width,
  height,
  linkSource,
  linkTarget,
  linkValue,
  colorScale,
  margin = defaultMargin,
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

  }, [data, nodes, linkSource, linkTarget, linkValue]);

  if (!root || width < 10) return null;

  return (
    <svg width={xMax} height={yMax}>
      <SankeyImpl></SankeyImpl>
    </svg>
  );
};

export default Sankey;
