import { useMemo } from "react";
import { scaleSqrt, scaleUtc } from "d3-scale";
import { useRoomStore } from "@/store";
import { extent, max } from "d3-array";
import { AxisBottom } from "@visx/axis";

const marginTop = 20;
const marginRight = 20;
const marginBottom = 30;
const marginLeft = 20;
const padding = 1.5;

const BeeswarmDisastersNew = ({ width, height }) => {
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

  const dataDodged = useMemo(() => {
    if (!disasters || !x || !r) return null;

    return dodge(
      // DEBUG:
      disasters.filter((d) => d["disaster_type"] === "flood"),
      (d) => x(d["start_date"]),
      (d) => r(d.affected),
    );
  }, [disasters, x, r]);

  console.log(dataDodged);

  return (
    <>
      {dataDodged && (
        <svg width={width} height={height}>
          <g>
            {dataDodged.map((d, i) => {
              return (
                <circle
                  key={i}
                  cx={d.x}
                  cy={height - marginBottom - padding - d.y}
                  r={d.r}
                  fill={disasterTypeColorScale(d.data["disaster_type"])}
                />
              );
            })}
          </g>

          <AxisBottom top={height - marginBottom} scale={x} />
        </svg>
      )}
    </>
  );
};

function dodge(data, x, r) {
  const circles = data
    .map((d) => ({ x: x(d), r: r(d), data: d }))
    .sort((a, b) => b.r - a.r);

  const epsilon = 1e-3;
  let head = null,
    tail = null,
    queue = null;

  // Returns true if circle ⟨x,y⟩ intersects with any circle in the queue.
  function intersects(x, y, r) {
    let a = head;
    while (a) {
      const radius2 = (a.r + r + padding) ** 2;
      if (radius2 - epsilon > (a.x - x) ** 2 + (a.y - y) ** 2) {
        return true;
      }
      a = a.next;
    }
    return false;
  }

  // Place each circle sequentially.
  for (const b of circles) {
    // Choose the minimum non-intersecting tangent.
    if (intersects(b.x, (b.y = b.r), b.r)) {
      let a = head;
      b.y = Infinity;
      do {
        let y = a.y + Math.sqrt((a.r + b.r + padding) ** 2 - (a.x - b.x) ** 2);
        if (y < b.y && !intersects(b.x, y, b.r)) b.y = y;
        a = a.next;
      } while (a);
    }

    // Add b to the queue.
    b.next = null;
    if (head === null) {
      head = tail = b;
      queue = head;
    } else tail = tail.next = b;
  }

  return circles;
}

export default BeeswarmDisastersNew;
