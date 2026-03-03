import DeckGL from "@deck.gl/react";
import { useMemo, useRef, useState } from "react";
import Map from "react-map-gl/maplibre";
import { ScatterplotLayer } from "@deck.gl/layers";

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
  const deckRef = useRef();

  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  const scatterLayer = useMemo(() => {
    if (!data) return null;

    return new ScatterplotLayer({
      id: "ScatterplotLayer",
      data,

      stroked: true,
      getPosition: (d) => [d.longitude, d.latitude],
      getRadius: (d) => Math.sqrt(d.sim_remittances_with),
      getFillColor: [255, 140, 0],
      getLineColor: [0, 0, 0],
      getLineWidth: 10,
      radiusScale: 6,
      pickable: true,
      lineWidthMinPixels: 1,
    });
  }, [data]);

  return (
    <>
      <DeckGL
        initialViewState={viewState}
        onViewStateChange={({ viewState: next }) => {
          setViewState(next);
        }}
        controller={true}
        getTooltip={({ object }) => {
          return object && object.destination;
        }}
        layers={[scatterLayer]}
      >
        <Map mapStyle={MAP_STYLE} projection="mercator" />
      </DeckGL>
    </>
  );
};

export default DeckGLMap;
