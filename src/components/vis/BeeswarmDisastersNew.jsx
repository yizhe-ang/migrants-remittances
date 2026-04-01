import { useMemo } from "react";
import { scaleSqrt, scaleUtc } from "d3-scale";
import { useRoomStore } from "@/store";
import { extent, max } from "d3-array";
import { AxisBottom } from "@visx/axis";
import Beeswarm from "@/components/vis/Beeswarm";
import { useParentSize } from "@visx/responsive";

const marginLeft = 20;
const marginRight = 20;
const marginBottom = 30;
const marginTop = 20;

const BeeswarmDisastersNew = () => {
  const { parentRef, width, height } = useParentSize();

  const disasters = useRoomStore((state) => state.disasters);
  const disasterTypeColorScale = useRoomStore(
    (state) => state.disasterTypeColorScale,
  );

  const x = useMemo(() => {
    if (!disasters) return null;

    return scaleUtc()
      .domain(extent(disasters, (d) => d["start_date"]))
      .range([marginLeft, width - marginRight]);
  }, [disasters, width]);

  const r = useMemo(() => {
    if (!disasters) return null;

    return (
      // FIXME:
      scaleSqrt()
        // .domain(extent(disasters, (d) => d.affected))
        .domain([0, max(disasters, (d) => d.affected)])
        .range([0, 70])
    );
  }, [disasters]);

  return (
    <div
      ref={parentRef}
      className="flex flex-col h-[95vh] w-screen max-w-[800px]"
    >
      {disasters &&
        ["earthquake", "storm", "drought", "flood"].map((key) => {
          return (
            <Beeswarm
              key={key}
              data={disasters.filter((d) => d.disaster_type === key)}
              xAccessor={(d) => d["start_date"]}
              xScale={x}
              r={(d) => r(d.affected)}
              c={(d) => disasterTypeColorScale(d["disaster_type"])}
              marginTop={marginTop}
              marginRight={marginRight}
              marginBottom={marginBottom}
              marginLeft={marginLeft}
            />
          );
        })}
    </div>
  );
};

export default BeeswarmDisastersNew;
