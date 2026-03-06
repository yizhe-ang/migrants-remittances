import { useMemo } from "react";
import { ScatterplotLayer } from "@deck.gl/layers";

// TODO: Should cluster nearby countries?

export default function useScatterPlotLayer({ data, ...props } = {}) {
  return useMemo(() => {
    if (!data) return null;

    return new ScatterplotLayer({
      id: "ScatterplotLayer",

      data,

      stroked: true,
      getPosition: (d) => [d.longitude, d.latitude],

      getRadius: (d) => Math.sqrt(d.sim_remittances_with),
      radiusScale: 1,

      getFillColor: [255, 140, 0],
      getLineColor: [0, 0, 0],
      getLineWidth: 10,

      pickable: true,

      radiusMinPixels: 1,
      // radiusMaxPixels: 100,
      lineWidthMinPixels: 1,

      onClick: (info, event) => {
        console.log(info.object);
      },

      ...props,
    });
  }, [data, props]);
}
