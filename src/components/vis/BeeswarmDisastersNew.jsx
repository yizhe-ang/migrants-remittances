import { Fragment, useMemo } from "react";
import { scaleLinear, scaleSqrt, scaleUtc } from "d3-scale";
import { useRoomStore } from "@/store";
import { extent, max } from "d3-array";
import { AxisBottom } from "@visx/axis";
import Beeswarm from "@/components/vis/Beeswarm";
import AreaChart from "@/components/vis/AreaChart";
import { ParentSize, useParentSize } from "@visx/responsive";

const marginLeft = 50;
const marginRight = 20;
const marginBottom = 30;
const marginTop = 20;

const BeeswarmDisastersNew = () => {
  const { parentRef, width, height } = useParentSize();

  const disastersImpactsByMonth = useRoomStore(
    (state) => state.disastersImpactsByMonth,
  );
  const disasters = useRoomStore((state) => state.disasters);
  const disasterTypeColorScale = useRoomStore(
    (state) => state.disasterTypeColorScale,
  );

  const xScale = useMemo(() => {
    if (!disasters || !disastersImpactsByMonth) return null;

    return (
      scaleUtc()
        .domain(extent(disasters, (d) => d["start_date"]))
        // .domain(extent(disastersImpactsByMonth, (d) => d["date"]))
        .range([marginLeft, width - marginRight])
    );
  }, [disasters, disastersImpactsByMonth, width]);

  const rScale = useMemo(() => {
    if (!disasters) return null;

    return (
      // FIXME:
      scaleSqrt()
        // .domain(extent(disasters, (d) => d.affected))
        .domain([0, max(disasters, (d) => d.affected)])
        .range([0, 65])
    );
  }, [disasters]);

  return (
    <div
      ref={parentRef}
      className="flex flex-col h-[95vh] w-screen max-w-[800px]"
    >
      {disasters &&
        disastersImpactsByMonth &&
        ["earthquake", "storm", "drought", "flood"].map((key, i) => {
          return (
            <div className="relative w-full h-full" key={key}>
              <Beeswarm
                data={disasters.filter((d) => d.disaster_type === key)}
                xAccessor={(d) => d["start_date"]}
                xScale={xScale}
                r={(d) => rScale(d.affected)}
                c={(d) => disasterTypeColorScale(d["disaster_type"])}
                marginTop={marginTop}
                marginRight={marginRight}
                marginBottom={marginBottom}
                marginLeft={marginLeft}
                showXAxis={i === 3}
              />
              <ParentSize className="absolute top-0 left-0 w-full h-full">
                {({ width, height }) => (
                  <AreaChart
                    key={`area-${key}`}
                    dataFull={disastersImpactsByMonth}
                    data={disastersImpactsByMonth.filter(
                      (d) => d["disaster_type"] === key + "s",
                    )}
                    width={width}
                    height={height}
                    yAccessor={(d) => d.remittance}
                    x={(d) => xScale(d["date"])}
                    colorScale={disasterTypeColorScale}
                    marginTop={marginTop}
                    marginRight={marginRight}
                    marginBottom={marginBottom}
                    marginLeft={marginLeft}
                  />
                )}
              </ParentSize>
            </div>
          );
        })}
    </div>
  );
};

export default BeeswarmDisastersNew;
