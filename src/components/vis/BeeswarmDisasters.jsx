import { useEffect, useMemo, useRef } from "react";
import * as Plot from "@observablehq/plot";
import { useRoomStore } from "@/store";

const disasterTypes = ["flood", "earthquake", "drought", "storm"];

const BeeswarmDisasters = ({ width = 700, height = 850 }) => {
  const containerRef = useRef(null);

  const disasters = useRoomStore((state) => state.disasters);

  useEffect(() => {
    if (!disasters) return;

    const plot = Plot.plot({
      title: "Disaster occurrences over time, sized by number of people affected",
      height,
      width,
      marginLeft: 80,
      marginTop: 100,
      color: {
        // legend: true,
        domain: disasterTypes,
      },
      r: {
        range: [0, 70],
      },
      fy: {
        label: null,
        tickFormat: (d) => "",
      },
      x: {
        label: null,
      },
      marks: [
        Plot.dot(
          disasters,
          Plot.dodgeY("bottom", {
            x: "start_date",
            r: "affected",
            fill: "disaster_type",
            fy: "disaster_type",
            // fillOpacity: 0.5
          }),
        ),
      ],
    });

    containerRef.current.append(plot);

    return () => {
      plot.remove();
    };
  }, [disasters, width, height]);

  return <div ref={containerRef} className="opacity-100"></div>;
};

export default BeeswarmDisasters;
