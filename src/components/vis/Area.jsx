import { ParentSize } from "@visx/responsive";
import { max } from "d3-array";
import { scaleLinear } from "d3-scale";
import { useMemo } from "react";

const Area = ({
  data,
  width,
  height,
  yAccessor,
  marginTop = 20,
  marginRight = 20,
  marginBottom = 30,
  marginLeft = 20,
}) => {
  const yScale = useMemo(() => {
    return scaleLinear()
      .domain([0, max(data, yAccessor)])
      .range([height - marginBottom, marginTop]);
  }, [data]);

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${marginLeft}, ${marginTop})`}></g>
    </svg>
  );
};

export default Area;
