import DeckGL from "@deck.gl/react";
import { useMemo, useRef, useState } from "react";
import Map from "react-map-gl/maplibre";
import useScatterPlotLayer from "./useScatterPlotLayer";
import useArcLayer from "./useArcLayer";
import { _GlobeView } from "deck.gl";
import {
  scaleLinear,
  scaleLog,
  scaleSequential,
  scaleSequentialLog,
  scaleSequentialPow,
  scaleSequentialQuantile,
  scaleSqrt,
} from "d3-scale";
import { scale } from "@observablehq/plot";
import { interpolateYlOrBr } from "d3-scale-chromatic";
import { extent, max } from "d3-array";
import { interpolatePuBuGn } from "d3-scale-chromatic";
import colors from "tailwindcss/colors";
import chroma from 'chroma-js';

console.log(colors.orange['200'])

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

const DeckGLMap = ({ ...props }) => {
  const { migAndRemByDestination, migAndRemByOrigin, migAndRemAvgYear } = props;

  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  const remFromColorScale = useMemo(() => {
    return scaleSequentialPow(interpolateYlOrBr)
      .domain(extent(migAndRemByDestination, valueAccessor))
      .exponent(0.4);
  });

  const remToColorScale = useMemo(() => {
    return scaleSequentialPow(interpolatePuBuGn)
      .domain(extent(migAndRemByOrigin, valueAccessor))
      .exponent(0.4);
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

  const widthScale = useMemo(() => {
    return scaleLinear()
      .domain([0, max(migAndRemAvgYear, valueAccessor)])
      .range([0, 50])
  }, [])

  // TODO: Allow toggling of different layers

  const remFromLayer = useScatterPlotLayer({
    data: migAndRemByDestination,
    getRadius: (d) => remRadiusScale(valueAccessor(d)),
    getFillColor: (d) => chroma(remFromColorScale(valueAccessor(d))).rgb()
    // radiusScale: getZoomFactor({ zoom: viewState.zoom }) * 0.0003,
  });
  const remToLayer = useScatterPlotLayer({
    data: migAndRemByOrigin,
    getRadius: (d) => remRadiusScale(valueAccessor(d)),
    getFillColor: (d) => chroma(remToColorScale(valueAccessor(d))).rgb(),
  });

  const remFlowsLayer = useArcLayer({
    data: migAndRemAvgYear,
    getSourceColor: [...chroma(colors.orange['500']).rgb(), 255 * 0.6],
    getTargetColor: [...chroma(colors.blue['500']).rgb(), 255 * 0.6],
    getWidth: (d) => widthScale(valueAccessor(d)),
  });

  return (
    <>
      <DeckGL
        initialViewState={viewState}
        onViewStateChange={({ viewState: next }) => {
          setViewState(next);
        }}
        controller={{
          inertia: true,
        }}
        getTooltip={({ object }) => {
          return object && JSON.stringify(object);
        }}
        layers={[remFromLayer, remToLayer, remFlowsLayer]}
        // views={new _GlobeView()}
      >
        <Map
          reuseMaps
          mapStyle={MAP_STYLE}
          projection="mercator"
          // projection="globe"
        />
      </DeckGL>
    </>
  );
};

function getZoomFactor({ zoom, zoomOffset = 0 }) {
  return Math.pow(2, Math.max(14 - zoom + zoomOffset, 0));
}

export default DeckGLMap;
