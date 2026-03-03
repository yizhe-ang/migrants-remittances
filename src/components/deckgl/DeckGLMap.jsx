import DeckGL from "@deck.gl/react";
import { GeoArrowScatterplotLayer } from "@geoarrow/deck.gl-layers";
import { Table } from "apache-arrow";
import { useMemo, useRef, useState } from "react";
import Map, { ViewState } from "react-map-gl/maplibre";

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const INITIAL_VIEW_STATE = {
  latitude: 0,
  longitude: 0,
  zoom: 1,
  bearing: 0,
  pitch: 0,
};

const MapView = () => {
  const deckRef = useRef()

  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [showInfo, setShowInfo] = useState(false);



  return (
    <div>MapView</div>
  )
}

export default MapView