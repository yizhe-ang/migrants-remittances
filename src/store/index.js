import {
  BaseRoomConfig,
  createRoomShellSlice,
  createRoomStore,
  persistSliceConfigs,
  LayoutTypes,
  LayoutConfig,
} from "@sqlrooms/room-shell";
import { createMosaicSlice } from "@sqlrooms/mosaic";

export const { roomStore, useRoomStore } = createRoomStore(
  // persistSliceConfigs(
  //   {
  //     name: "deckgl-mosaic-example-app-state-storage",
  //     sliceConfigSchemas: {
  //       room: BaseRoomConfig,
  //       layout: LayoutConfig,
  //       sqlEditor: SqlEditorSliceConfig,
  //       mapSettings: MapSettingsConfig,
  //     },
  //   },
  (set, get, store) => ({
    // Room shell slice
    ...createRoomShellSlice({
      config: {
        dataSources: [
          {
            tableName: "countries_geo",
            type: "url",
            url: "/data/countries_geo.parquet",
          },
          {
            tableName: "countries_stats",
            type: "url",
            url: "/data/countries_stats.parquet",
          },
          {
            tableName: "disasters_impacts",
            type: "url",
            url: "/data/disasters_impacts.parquet",
          },
          {
            tableName: "mig_and_rem",
            type: "url",
            url: "/data/mig_and_rem.parquet",
          },
          {
            tableName: "rem_panel",
            type: "url",
            url: "/data/rem_panel.parquet",
          },
          {
            tableName: "disasters",
            type: "url",
            url: "/data/disasters.parquet",
          },
        ],
      },
    })(set, get, store),

    ...createMosaicSlice()(set, get, store),

    // Data stores
    countriesGeo: null,
    setCountriesGeo: (countriesGeo) => set({ countriesGeo }),

    countriesGeoMap: null,
    setCountriesGeoMap: (map) => set({ countriesGeoMap: map }),

    countriesAggStatsMap: null,
    setCountriesAggStatsMap: (map) => set({ countriesAggStatsMap: map }),

    flowsByOrigin: null,
    setFlowsByOrigin: (flowsByOrigin) => set({ flowsByOrigin }),

    flowsByDestination: null,
    setFlowsByDestination: (flowsByDestination) => set({ flowsByDestination }),
  }),
  // ),
);
