import { useMemo } from "react";
import { ScatterplotLayer } from "@deck.gl/layers";

// TODO: Sort by size

// TODO: To cluster nearby points?

export default function useScatterPlotLayer({ data, ...props } = {}) {
  return useMemo(() => {
    if (!data) return null;

    return new ScatterplotLayer({
      data,

      stroked: true,

      getPosition: (d) => [d.longitude, d.latitude],

      getFillColor: [255, 140, 0],

      getLineColor: [0, 0, 0, 255 * 0.5],
      getLineWidth: 10,

      pickable: true,

      parameters: {
        depthTest: false,
        // blendColorOperation: "add",
        // blendColorSrcFactor: "src-alpha",
        // blendColorDstFactor: "one",
        // blendAlphaOperation: "add",
        // blendAlphaSrcFactor: "one",
        // blendAlphaDstFactor: "one",
      },

      radiusUnits: "pixels",
      radiusMinPixels: 2,
      // radiusMaxPixels: 100,
      lineWidthMinPixels: 1,

      ...props,
    });
  }, [data, props]);
}
