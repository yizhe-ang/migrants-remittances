import { Fragment, useMemo } from "react";
import { scaleLinear, scaleSqrt, scaleUtc } from "d3-scale";
import { useRoomStore } from "@/store";
import { extent, max } from "d3-array";
import { AxisBottom } from "@visx/axis";
import Beeswarm from "@/components/vis/Beeswarm";
import AreaChart from "@/components/vis/AreaChart";
import { ParentSize, useParentSize } from "@visx/responsive";
import RectDisastersNew from "./RectDisastersNew";

const marginLeft = 50;
const marginRight = 20;
const marginBottom = 30;
const marginTop = 20;

const DisastersChart = () => {
  const { parentRef, width, height } = useParentSize();

  const disastersImpactsByMonth = useRoomStore(
    (state) => state.disastersImpactsByMonth,
  );
  const disasters = useRoomStore((state) => state.disasters);
  const disasterTypeColorScale = useRoomStore(
    (state) => state.disasterTypeColorScale,
  );
  const disastersRadiusScale = useRoomStore(
    (state) => state.disastersRadiusScale,
  );

  const xScale = useMemo(() => {
    if (!disasters || !disastersImpactsByMonth) return null;

    return (
      scaleUtc()
        .domain(extent(disasters, (d) => d["start_date"]))
        // .domain(extent(disastersImpactsByMonth, (d) => d["date"]))
        .range([0, width - marginRight - marginLeft])
    );
  }, [disasters, disastersImpactsByMonth, width]);

  return (
    <div
      ref={parentRef}
      className="flex flex-col h-[95vh] w-screen max-w-[800px] pb-5 relative pt-5"
    >
      {disasters &&
        disastersImpactsByMonth &&
        disastersRadiusScale &&
        ["earthquake", "storm", "flood", "drought"].map((key, i) => {
          return (
            <div className="relative w-full h-full" key={key}>
              <Beeswarm
                data={disasters.filter((d) => d.disaster_type === key)}
                xAccessor={(d) => d["start_date"]}
                xScale={xScale}
                r={(d) => disastersRadiusScale(d.affected)}
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
      <ParentSize className="absolute w-full h-full max-h-[500px] top-1/2 left-0 -translate-y-1/2">
        {({ width, height }) => (
          <RectDisastersNew
            width={width}
            height={height}
            marginLeft={marginLeft}
            marginRight={marginRight}
          />
        )}
      </ParentSize>
    </div>
  );
};

export default DisastersChart;
