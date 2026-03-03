import DeckGL from "@deck.gl/react";
import { useMemo, useRef, useState } from "react";
import Map from "react-map-gl/maplibre";
import useScatterPlotLayer from "./useScatterPlotLayer";

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const INITIAL_VIEW_STATE = {
  latitude: 0,
  longitude: 0,
  zoom: 1,
  bearing: 0,
  pitch: 0,
};

const DeckGLMap = ({ data }) => {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  const remFromLayer = useScatterPlotLayer({
    data,
    radiusScale: 2,
    // radiusScale: getZoomFactor({ zoom: viewState.zoom }) * 0.0003,
  });

  return (
    <>
      <DeckGL
        initialViewState={viewState}
        onViewStateChange={({ viewState: next }) => {
          setViewState(next);
        }}
        controller={true}
        getTooltip={({ object }) => {
          return (
            object && JSON.stringify(object)
          );
        }}
        layers={[remFromLayer]}
      >
        <Map mapStyle={MAP_STYLE} projection="mercator" />
      </DeckGL>
    </>
  );
};

function getZoomFactor({ zoom, zoomOffset = 0 }) {
  return Math.pow(2, Math.max(14 - zoom + zoomOffset, 0));
}

export default DeckGLMap;
