import { AreaClosed, Area, LinePath } from "@visx/shape";
import { max } from "d3-array";
import { scaleLinear } from "d3-scale";
import { useMemo } from "react";
import { curveMonotoneX } from "@visx/curve";
import { AxisLeft } from "@visx/axis";
import { format } from "d3-format";
import { GridRows } from "@visx/grid";

const AreaChart = ({
  dataFull,
  data,
  width,
  height,
  yAccessor,
  x,
  colorScale,
  marginTop = 20,
  marginRight = 20,
  marginBottom = 30,
  marginLeft = 20,
}) => {
  if (width < 10) return null;

  const yScale = useMemo(() => {
    return scaleLinear()
      .domain([0, max(dataFull, yAccessor)])
      .range([height - marginTop - marginBottom, 0]);
  }, [dataFull]);

  const fillColor = colorScale(data[0].disaster_type.slice(0, -1));
  const gradientId = `area-gradient-${data[0].disaster_type}`;

  return (
    <svg width={width} height={height} className="area-chart">
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="0"
          y2={height - marginTop - marginBottom}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={fillColor} stopOpacity={0.8} />
          <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <g transform={`translate(${0}, ${marginTop})`}>
        {/* <GridRows
          scale={yScale}
          width={width - marginLeft}
          left={marginLeft}
          numTicks={4}
        /> */}
        <AreaClosed
          className="disaster-area"
          data={data}
          x={x}
          y={(d) => yScale(yAccessor(d))}
          yScale={yScale}
          curve={curveMonotoneX}
          fill={`url(#${gradientId})`}
        />
        <LinePath
          className="disaster-line"
          curve={curveMonotoneX}
          data={data}
          // fill={colorScale(data[0].disaster_type.slice(0, -1))}
          x={x}
          y={(d) => yScale(yAccessor(d))}
          stroke={colorScale(data[0].disaster_type.slice(0, -1))}
          strokeWidth={3}
        />
        <AxisLeft
          axisClassName="disaster-area-axis"
          left={marginLeft}
          scale={yScale}
          hideAxisLine
          hideTicks
          numTicks={4}
          tickFormat={(d) => {
            const s = format("$.2s")(d);
            return s.replace("G", "B"); // D3 uses "G" (giga) not "B" (billion)
          }}
          tickLabelProps={() => ({
            dx: "-0.25em",
            dy: "0.25em",
            fill: "#222",
            fontSize: 10,
            textAnchor: "end",
            // your additions
            stroke: "white",
            strokeWidth: 3,
            paintOrder: "stroke",
          })}
        />
      </g>
    </svg>
  );
};

export default AreaChart;
