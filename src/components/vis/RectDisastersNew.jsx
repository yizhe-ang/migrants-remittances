import { useEffect, useMemo, useRef } from "react";
import { index, max, mean, rollup, sum } from "d3-array";
import { useRoomStore } from "@/store";
import { scaleLinear } from "d3-scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { HtmlLabel, Connector, Annotation } from "@visx/annotation";
import { Text } from "@visx/text";

const marginBottom = 30;
const marginTop = 20;

const disasterOrder = ["earthquake", "storm", "flood", "drought"];

const disasterTypeMap = new Map([
  ["flood", "floods"],
  ["earthquake", "earthquakes"],
  ["storm", "storms"],
  ["drought", "droughts"],
]);

const fmt = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const RectDisastersNew = ({ width, height, marginLeft, marginRight }) => {
  const disastersImpactsByMonth = useRoomStore(
    (state) => state.disastersImpactsByMonth,
  );
  const disasters = useRoomStore((state) => state.disasters);
  const disasterTypeColorScale = useRoomStore(
    (state) => state.disasterTypeColorScale,
  );

  const aggData = useMemo(() => {
    if (!disastersImpactsByMonth || !disasters) return;

    const o = Object.fromEntries(
      [...disasterTypeMap.keys()].map((v) => [v, {}]),
    );

    const remittancesByDisaster = rollup(
      disastersImpactsByMonth,
      (v) => sum(v, (d) => d.remittance),
      (d) => d.disaster_type,
    );

    const affectedByDisaster = rollup(
      disasters,
      (v) => sum(v, (d) => d.affected),
      (d) => d["disaster_type"],
    );

    const affectedPerOccurrence = rollup(
      disasters,
      (v) => mean(v, (d) => d.affected),
      (d) => d["disaster_type"],
    );

    [...disasterTypeMap.keys()].forEach((k) => {
      o[k].remittances = remittancesByDisaster.get(disasterTypeMap.get(k));

      o[k].affected = affectedByDisaster.get(k);
      o[k].affected_per_occurrence = affectedPerOccurrence.get(k);

      o[k].remittance_per_affected = o[k].remittances / o[k].affected;
    });

    const aggData = Object.entries(o).map(([k, v]) => {
      return {
        ...v,
        disaster_type: k,
      };
    });

    return aggData.sort((a, b) => {
      return (
        disasterOrder.indexOf(a.disaster_type) -
        disasterOrder.indexOf(b.disaster_type)
      );
    });
  }, [disastersImpactsByMonth, disasters]);

  const xScale = useMemo(() => {
    if (!aggData) return;

    return scaleLinear()
      .domain([0, sum(aggData, (d) => d.affected)])
      .range([0, width - marginLeft - marginRight]);
  }, [aggData]);

  const yScale = useMemo(() => {
    if (!aggData) return;

    return scaleLinear()
      .domain([0, max(aggData, (d) => d.remittance_per_affected)])
      .range([height - marginTop - marginBottom, 0]);
  }, [aggData]);

  const stackedX = useMemo(() => {
    if (!aggData || !xScale) return;

    let cumulative = 0;

    const stacked = aggData.map((d) => {
      const x0 = cumulative;
      cumulative += d.affected;

      return {
        // x0,
        // x1: cumulative,
        x0Scaled: xScale(x0),
        x1Scaled: xScale(cumulative),
      };
    });

    return stacked;
  }, [aggData, xScale]);

  return (
    <>
      {yScale && xScale && (
        <svg
          width={width}
          height={height}
          className="overflow-visible pointer-events-none"
          id="disaster-rects"
        >
          <g transform={`translate(${marginLeft}, ${marginTop})`}>
            <g>
              {stackedX?.map((d, i) => {
                return (
                  <rect
                    rx={5}
                    ry={5}
                    key={i}
                    x={d.x0Scaled}
                    y={yScale(aggData[i].remittance_per_affected)}
                    width={d.x1Scaled - d.x0Scaled}
                    height={
                      yScale(0) - yScale(aggData[i].remittance_per_affected)
                    }
                    fill={disasterTypeColorScale(aggData[i].disaster_type)}
                  />
                );
              })}
            </g>

            <g className="rect-disasters-axis-left">
              <Text className="text-xs" width={100} x={-35} y={-20}>
                Remittance-induced per person ↑
              </Text>
              <AxisLeft
                // axisClassName="rect-disasters-axis-left"
                hideAxisLine
                // hideTicks
                scale={yScale}
                tickFormat={(t) => "$" + t}
                tickLabelProps={() => ({
                  dx: "-0.25em",
                  dy: "0.25em",
                  fill: "#222",
                  fontSize: 10,
                  textAnchor: "end",
                  // your additions
                  // stroke: "white",
                  // strokeWidth: 3,
                  // paintOrder: "stroke",
                })}
              />
            </g>
            <g className="rect-disasters-axis-bottom">
              <Text
                className="text-xs"
                x={width - marginLeft - marginRight}
                y={height - marginTop - marginBottom}
                textAnchor="end"
                verticalAnchor="start"
                dy={30}
              >
                Total affected →
              </Text>
              <AxisBottom
                // axisClassName="rect-disasters-axis-bottom"
                // hideTicks
                hideAxisLine
                top={height - marginBottom - marginTop}
                scale={xScale}
                tickFormat={(t) => fmt.format(t)}
                tickLabelProps={() => ({
                  dy: "0.25em",
                  fill: "#222",
                  fontSize: 10,
                  textAnchor: "middle",
                  // fontWeight: 600,
                })}
              />
            </g>

            <g id="rect-annotation">
              <Annotation
                x={xScale(1_400_000_000)}
                y={yScale(10)}
                dx={-width * 0.12}
                dy={-height * 0.15}
              >
                <Connector />
                {/* <CircleSubject radius={d.r} /> */}
                <HtmlLabel
                  showBackground={false}
                  showAnchorLine={false}
                  className="pointer-events-auto"
                  containerStyle={{ pointerEvents: "auto" }}
                >
                  <div className="px-2 text-xs w-40 py-2">
                    Droughts affected a total of{" "}
                    <span className="font-bold">676 million</span> people from
                    2010 to 2019
                  </div>
                </HtmlLabel>
              </Annotation>
            </g>
          </g>
        </svg>
      )}
    </>
  );
};

export default RectDisastersNew;
