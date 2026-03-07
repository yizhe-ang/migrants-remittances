import DeckGL from "@deck.gl/react";
import { useMemo, useRef, useState } from "react";
import Map from "react-map-gl/maplibre";
import useScatterPlotLayer from "./useScatterPlotLayer";
import useArcLayer from "./useArcLayer";
import { _GlobeView, MapView } from "deck.gl";
import {
  scaleLinear,
  scaleLog,
  scaleOrdinal,
  scalePow,
  scaleSequential,
  scaleSequentialLog,
  scaleSequentialPow,
  scaleSequentialQuantile,
  scaleSqrt,
} from "d3-scale";
import { scale } from "@observablehq/plot";
import { interpolateYlOrBr, schemeObservable10 } from "d3-scale-chromatic";
import { extent, max } from "d3-array";
import { interpolatePuBuGn } from "d3-scale-chromatic";
import colors from "tailwindcss/colors";
import chroma from "chroma-js";
import { folder, useControls } from "leva";
import { useRoomStore } from "@/store";
import { Slider } from "@/components/ui/slider";
import { DataFilterExtension } from "@deck.gl/extensions";

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

// TODO: Can tilt the map a little bit
const INITIAL_VIEW_STATE = {
  latitude: 0,
  longitude: 0,
  zoom: 1,
  bearing: 0,
  pitch: 0,
};

const valueAccessor = (d) => d.sim_remittances_with;

// TODO: Two views? One for remittances and one for disasters

const DeckGLMap = ({ ...props }) => {
  const {
    migAndRemByDestination,
    migAndRemByOrigin,
    migAndRemAvgYear,
    disasters,
    disastersByCountry,
  } = props;

  const disastersProcessed = useMemo(() => {
    return disasters
      .sort((a, b) => b.affected - a.affected)
      .map((d) => {
        return {
          ...d,
          longitude: d.longitude + (Math.random() * 2 - 1),
          latitude: d.latitude + (Math.random() * 2 - 1),
        };
      });
  }, [disasters]);

  const {
    filterByTimestamp,
    showRemFrom,
    showRemTo,
    showFlow,
    showDisasters,
    disastersRadiusExponent,
  } = useControls("deckgl", {
    layers: folder({
      filterByTimestamp: false,
      showRemFrom: true,
      showRemTo: false,
      showFlow: false,
      showDisasters: true,
    }),
    scales: folder({
      disastersRadiusExponent: {
        value: 0.25,
        min: 0,
        max: 1,
      },
    }),
  });

  const [timestamp, setTimestamp] = useState(new Date("2010-01-01").getTime());

  const countriesGeoMap = useRoomStore((s) => s.countriesGeoMap);

  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  const remFromColorScale = useMemo(() => {
    return scaleSequentialPow(interpolateYlOrBr)
      .domain(extent(migAndRemByDestination, valueAccessor))
      .exponent(0.4);
  }, []);

  const remToColorScale = useMemo(() => {
    return scaleSequentialPow(interpolatePuBuGn)
      .domain(extent(migAndRemByOrigin, valueAccessor))
      .exponent(0.4);
  }, []);

  const disastersColorScale = useMemo(() => {
    return scaleOrdinal(schemeObservable10).domain([
      "flood",
      "earthquake",
      "drought",
      "storm",
    ]);
  }, []);

  const remRadiusScale = useMemo(() => {
    // TODO: use log scale or sth for this?
    return scaleSqrt()
      .domain([
        0,
        max([...migAndRemByDestination, ...migAndRemByOrigin], valueAccessor),
      ])
      .range([0, 50]);
  }, []);

  const disastersRadiusScale = useMemo(() => {
    // return scaleSqrt()
    return scalePow()
      .exponent(disastersRadiusExponent)
      .domain([0, max(disastersProcessed, (d) => d.affected)])
      .range([0, 70]);
  }, [disastersRadiusExponent]);

  const widthScale = useMemo(() => {
    return scaleLinear()
      .domain([0, max(migAndRemAvgYear, valueAccessor)])
      .range([0, 50]);
  }, []);

  // TODO: Allow toggling of different layers

  const remFromLayer = useScatterPlotLayer({
    id: "remFrom",
    data: migAndRemByDestination,
    getRadius: (d) => remRadiusScale(valueAccessor(d)),
    getFillColor: (d) => chroma(remFromColorScale(valueAccessor(d))).rgb(),
    // radiusScale: getZoomFactor({ zoom: viewState.zoom }) * 0.0003,
    visible: showRemFrom,
  });
  const remToLayer = useScatterPlotLayer({
    id: "remTo",
    data: migAndRemByOrigin,
    getRadius: (d) => remRadiusScale(valueAccessor(d)),
    getFillColor: (d) => chroma(remToColorScale(valueAccessor(d))).rgb(),
    visible: showRemTo,
  });

  const disastersLayer = useScatterPlotLayer({
    id: "disasters",
    data: disastersProcessed,

    getRadius: (d) => disastersRadiusScale(d.affected),
    radiusMinPixels: 3,

    getFillColor: (d) => [
      ...chroma(disastersColorScale(d.disaster_type)).rgb(),
      255 * 0.7,
    ],
    getPosition: (d) => [
      // d.longitude + (Math.random() * 2 - 1),
      // d.latitude + (Math.random() * 2 - 1)
      d.longitude,
      d.latitude,
    ],
    visible: showDisasters,

    getFilterValue: (d) => [d.start_date, d.end_date],
    filterSoftRange: [
      [-Infinity, timestamp],
      [timestamp, Infinity],
    ],
    filterRange: [
      [-Infinity, timestamp + 2_592_000_000 * 3],
      [timestamp - 2_592_000_000 * 3, Infinity],
    ],
    filterEnabled: filterByTimestamp,
    extensions: [new DataFilterExtension({ filterSize: 2 })],
  });

  const remFlowsLayer = useArcLayer({
    id: "remFlows",
    data: migAndRemAvgYear,
    getSourceColor: [...chroma(colors.orange["500"]).rgb(), 255 * 0.6],
    getTargetColor: [...chroma(colors.blue["500"]).rgb(), 255 * 0.6],
    getWidth: (d) => widthScale(valueAccessor(d)),
    visible: showFlow,
  });

  return (
    <>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: next }) => {
          setViewState(next);
        }}
        controller={{
          inertia: true,
        }}
        getTooltip={({ object }) => {
          // return object && JSON.stringify(object);
          return (
            object && {
              html: `<pre>${JSON.stringify(object, null, 2)}</pre>`,
              style: {
                fontSize: "10px",
              },
            }
          );
        }}
        layers={[remFromLayer, remToLayer, remFlowsLayer, disastersLayer]}
      >
        <MapView id="left" controller={true} x={0} width="50%">
          <Map id="left" mapStyle={MAP_STYLE} />
        </MapView>
        <MapView id="right" controller={true} x="50%" width="50%">
          <Map id="right" mapStyle={MAP_STYLE} />
        </MapView>
      </DeckGL>

      <div className="absolute bottom-10 left-0 px-4 w-full flex-col flex gap-2">
        <div>{new Date(timestamp).toISOString().split("T")[0]}</div>
        <Slider
          value={timestamp}
          onValueChange={setTimestamp}
          min={new Date("2010-01-01").getTime()}
          max={new Date("2019-12-31").getTime()}
        />
      </div>
    </>
  );
};

function getZoomFactor({ zoom, zoomOffset = 0 }) {
  return Math.pow(2, Math.max(14 - zoom + zoomOffset, 0));
}

export default DeckGLMap;
