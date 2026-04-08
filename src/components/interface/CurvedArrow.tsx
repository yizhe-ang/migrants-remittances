import {
  useId,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type Point = {
  x: number;
  y: number;
};

export type CurvedArrowProps = Omit<
  ComponentProps<"svg">,
  "children" | "color" | "start" | "end"
> & {
  start: Point;
  end: Point;
  curve?: number;
  strokeWidth?: number;
  color?: string;
  headSize?: number;
  headAt?: "end" | "start" | "both" | "none";
  dashArray?: string;
  lineCap?: "round" | "square" | "butt";
  label?: ReactNode;
  labelOffset?: number;
  startLabel?: ReactNode;
  startLabelOffset?: number;
  startLabelClassName?: string;
  startLabelAlign?: "start" | "center" | "end";
  pathClassName?: string;
  animated?: boolean;
  padding?: number;
};

const quadraticPointAt = (
  start: Point,
  control: Point,
  end: Point,
  t: number,
) => {
  const oneMinusT = 1 - t;

  return {
    x:
      oneMinusT * oneMinusT * start.x +
      2 * oneMinusT * t * control.x +
      t * t * end.x,
    y:
      oneMinusT * oneMinusT * start.y +
      2 * oneMinusT * t * control.y +
      t * t * end.y,
  };
};

type LabelAnchor = "start" | "center" | "end";

function ArrowLabel({
  x,
  y,
  children,
  className,
  align = "center",
}: {
  x: number;
  y: number;
  children: ReactNode;
  className?: string;
  align?: LabelAnchor;
}) {
  const width = 160;
  const height = 40;
  const anchorX = align === "start" ? 0 : align === "end" ? -width : -width / 2;

  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none">
      <foreignObject
        x={anchorX}
        y={-height / 2}
        width={width}
        height={height}
        className="overflow-visible"
      >
        <div
          className={cn(
            "flex h-full items-center text-sm font-medium text-current",
            align === "start" && "justify-start text-left",
            align === "center" && "justify-center text-center",
            align === "end" && "justify-end text-right",
            className,
          )}
        >
          {children}
        </div>
      </foreignObject>
    </g>
  );
}

function CurvedArrow({
  start,
  end,
  curve = 0,
  strokeWidth = 2.5,
  color = "currentColor",
  headSize = 12,
  headAt = "end",
  dashArray,
  lineCap = "round",
  label,
  labelOffset = 18,
  startLabel,
  startLabelOffset = 14,
  startLabelClassName,
  startLabelAlign = "start",
  className,
  pathClassName,
  animated = false,
  padding,
  width,
  height,
  style,
  ...props
}: CurvedArrowProps) {
  const markerId = useId().replace(/:/g, "");
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
  const normal = {
    x: -dy / length,
    y: dx / length,
  };
  const control = {
    x: midpoint.x + normal.x * curve,
    y: midpoint.y + normal.y * curve,
  };
  const pathData = `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
  const labelPoint = quadraticPointAt(start, control, end, 0.5);
  const labelDirection = curve === 0 ? 1 : Math.sign(curve);
  const labelPosition = {
    x: labelPoint.x + normal.x * labelOffset * labelDirection,
    y: labelPoint.y + normal.y * labelOffset * labelDirection,
  };
  const startLabelPosition = {
    x: start.x + normal.x * startLabelOffset * labelDirection,
    y: start.y + normal.y * startLabelOffset * labelDirection,
  };
  const framePadding =
    padding ??
    Math.max(headSize * 2, strokeWidth * 3, Math.abs(curve) * 0.15 + 16);

  const xs = [start.x, end.x, control.x];
  const ys = [start.y, end.y, control.y];
  const minX = Math.min(...xs) - framePadding;
  const maxX = Math.max(...xs) + framePadding;
  const minY = Math.min(...ys) - framePadding;
  const maxY = Math.max(...ys) + framePadding;
  const svgWidth = maxX - minX;
  const svgHeight = maxY - minY;
  const computedDashArray = animated
    ? (dashArray ?? `${strokeWidth * 2.4} ${strokeWidth * 2.4}`)
    : dashArray;
  const markerStart =
    headAt === "start" || headAt === "both"
      ? `url(#${markerId}-start)`
      : undefined;
  const markerEnd =
    headAt === "end" || headAt === "both" ? `url(#${markerId}-end)` : undefined;
  const svgStyle: CSSProperties = {
    overflow: "visible",
    display: "block",
    ...style,
  };

  return (
    <svg
      width={width ?? svgWidth}
      height={height ?? svgHeight}
      viewBox={`${minX} ${minY} ${svgWidth} ${svgHeight}`}
      className={cn("text-foreground", className)}
      style={svgStyle}
      aria-hidden={label || startLabel ? undefined : true}
      {...props}
    >
      <defs>
        <marker
          id={`${markerId}-end`}
          markerWidth={headSize}
          markerHeight={headSize}
          refX={headSize * 0.9}
          refY={headSize / 2}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d={`M 0 0 L ${headSize} ${headSize / 2} L 0 ${headSize} z`}
            fill={color}
          />
        </marker>

        <marker
          id={`${markerId}-start`}
          markerWidth={headSize}
          markerHeight={headSize}
          refX={headSize * 0.1}
          refY={headSize / 2}
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse"
        >
          <path
            d={`M 0 0 L ${headSize} ${headSize / 2} L 0 ${headSize} z`}
            fill={color}
          />
        </marker>
      </defs>

      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap={lineCap}
        strokeLinejoin="round"
        strokeDasharray={computedDashArray}
        markerStart={markerStart}
        markerEnd={markerEnd}
        className={cn(
          animated && "drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]",
          pathClassName,
        )}
      >
        {animated ? (
          <animate
            attributeName="stroke-dashoffset"
            values="0;-24"
            dur="1.1s"
            repeatCount="indefinite"
          />
        ) : null}
      </path>

      {startLabel ? (
        <ArrowLabel
          x={startLabelPosition.x}
          y={startLabelPosition.y}
          className={startLabelClassName}
          align={startLabelAlign}
        >
          {startLabel}
        </ArrowLabel>
      ) : null}

      {label ? (
        <ArrowLabel x={labelPosition.x} y={labelPosition.y}>
          {label}
        </ArrowLabel>
      ) : null}
    </svg>
  );
}

export default CurvedArrow;
