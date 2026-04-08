import { useId, useMemo } from "react";
import { AxisBottom } from "@visx/axis";
import { ParentSize } from "@visx/responsive";

const Beeswarm = ({
  data,
  xAccessor,
  xScale,
  r,
  c,
  marginTop = 20,
  marginRight = 20,
  marginBottom = 30,
  marginLeft = 20,
  padding = 1.5,
  showXAxis = false,
}) => {
  const gradientPrefix = useId().replace(/:/g, "");
  const x = (d) => xScale(xAccessor(d));

  const dataDodged = useMemo(() => {
    if (!data || !x || !r) return null;

    return dodge(data, x, r, padding).sort(
      (a, b) => xAccessor(a.data) - xAccessor(b.data),
    );
  }, [data, x, r]);

  const gradientIds = useMemo(() => {
    if (!dataDodged) return new Map();

    const ids = new Map();

    dataDodged.forEach((d) => {
      const color = c(d.data);
      if (!ids.has(color)) {
        ids.set(color, `${gradientPrefix}-${ids.size}`);
      }
    });

    return ids;
  }, [c, dataDodged, gradientPrefix]);

  // TODO: Annotate some data points, to also serve as a radius scale

  return (
    <>
      <ParentSize className="w-full h-full">
        {({ width, height }) => (
          <>
            {dataDodged && (
              <svg
                width={width}
                height={height}
                className="overflow-visible beeswarm"
              >
                <defs>
                  {[...gradientIds.entries()].map(([color, id]) => (
                    <radialGradient key={id} id={id}>
                      <stop offset="0%" stopColor={color} stopOpacity={0} />
                      <stop offset="100%" stopColor={color} stopOpacity={1} />
                    </radialGradient>
                  ))}
                </defs>
                <g transform={`translate(${marginLeft}, ${marginTop})`}>
                  <g className="beeswarm-circles">
                    {dataDodged.map((d, i) => {
                      const color = c(d.data);
                      return (
                        <circle
                          key={i}
                          cx={d.x}
                          cy={height - marginBottom - padding - d.y - marginTop}
                          r={d.r}
                          fill={`url(#${gradientIds.get(color)})`}
                          onClick={() => {
                            console.log(d)
                          }}
                        />
                      );
                    })}
                  </g>

                  {showXAxis && (
                    <AxisBottom
                      axisClassName="beeswarm-axis"
                      top={height - marginBottom - marginTop}
                      scale={xScale}
                      hideTicks
                      hideAxisLine={true}
                      axisLineClassName="stroke-2 stroke-stone-400"
                      tickLabelProps={() => ({
                        dy: "0.25em",
                        fill: "#222",
                        fontSize: 12,
                        textAnchor: "middle",
                        fontWeight: 600,
                      })}
                    />
                  )}
                </g>
              </svg>
            )}
          </>
        )}
      </ParentSize>
    </>
  );
};

function dodge(data, x, r, padding) {
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

export default Beeswarm;
