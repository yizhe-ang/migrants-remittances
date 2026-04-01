import { useMemo } from "react";
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
}) => {
  const x = (d) => xScale(xAccessor(d));

  const dataDodged = useMemo(() => {
    if (!data || !x || !r) return null;

    return dodge(data, x, r, padding);
  }, [data, x, r]);

  return (
    <>
      <ParentSize className="">
        {({ width, height }) => (
          <>
            {dataDodged && (
              <svg width={width} height={height} className="overflow-visible">
                <g>
                  {dataDodged.map((d, i) => {
                    return (
                      <circle
                        key={i}
                        cx={d.x}
                        cy={height - marginBottom - padding - d.y}
                        r={d.r}
                        fill={c(d.data)}
                      />
                    );
                  })}
                </g>

                <AxisBottom top={height - marginBottom} scale={xScale} />
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
