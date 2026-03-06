import { useMemo } from "react";
import { ArcLayer } from "@deck.gl/layers";
import { useRoomStore } from "@/store";

// TODO: Arcs could be thinner at the ends

// TODO: What to do with overlapping arcs?
// from <-> to the same countries
// Use the tilt property?

// TODO: Create controls

// TODO: Edge bundling?

export default function useArcLayer({ data, ...props } = {}) {
  const countriesGeoMap = useRoomStore((s) => s.countriesGeoMap);

  return useMemo(() => {
    if (!data || !countriesGeoMap) return null;

    return new ArcLayer({
      data,
      getSourcePosition: (d) => {
        const g = countriesGeoMap.get(d.destination);
        return [g.longitude, g.latitude];
      },
      getTargetPosition: (d) => {
        const g = countriesGeoMap.get(d.origin);
        return [g.longitude, g.latitude];
      },
      getSourceColor: [255, 0, 128, 255 * 0.5],
      getTargetColor: [0, 200, 255, 255 * 0.5],

      widthUnits: "pixels",
      // widthMinPixels: 0.1,

      getHeight: 1,

      getTilt: 10,

      pickable: true,
      ...props,
    });
  }, [data, countriesGeoMap]);
}
