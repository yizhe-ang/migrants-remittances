import DeckGL from "@deck.gl/react";
import { useMemo, useRef, useState } from "react";
import Map from "react-map-gl/maplibre";
import useScatterPlotLayer from "./useScatterPlotLayer";
import useArcLayer from "./useArcLayer";
import { _GlobeView } from "deck.gl";

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

const DeckGLMap = ({ ...props }) => {
  const { migAndRemByDestination, migAndRemAvgYear } = props;

  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  // TODO: Allow toggling of different layers

  const remFromLayer = useScatterPlotLayer({
    data: migAndRemByDestination,
    radiusScale: 2,
    // radiusScale: getZoomFactor({ zoom: viewState.zoom }) * 0.0003,
  });
  // const remToLayer = useScatterPlotLayer({
  //   data,
  //   radiusScale: 2,
  //   // radiusScale: getZoomFactor({ zoom: viewState.zoom }) * 0.0003,
  // });

  const remFlowsLayer = useArcLayer({
    data: migAndRemAvgYear,
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
        layers={[remFromLayer, remFlowsLayer]}
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
