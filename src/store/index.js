import { createWasmDuckDbConnector } from "@sqlrooms/duckdb";
import {
  BaseRoomConfig,
  createRoomShellSlice,
  createRoomStore,
  persistSliceConfigs,
  LayoutTypes,
  LayoutConfig,
} from "@sqlrooms/room-shell";
import {
  createSqlEditorSlice,
  SqlEditorSliceConfig,
} from "@sqlrooms/sql-editor";
import { DatabaseIcon } from "lucide-react";
import MainView from "@/components/MainView";
import { createMosaicSlice } from "@sqlrooms/mosaic";
import { createMapSettingsSlice, MapSettingsConfig } from "./MapSettingsSlice";
import DataSourcesPanel from "@/components/rooms/DataSourcesPanel";

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
    // Sql editor slice
    ...createSqlEditorSlice()(set, get, store),

    // Room shell slice
    ...createRoomShellSlice({
      connector: createWasmDuckDbConnector({
        initializationQuery: "LOAD spatial",
      }),
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
      layout: {
        config: {
          type: LayoutTypes.enum.mosaic,
          nodes: "main",
        },
        panels: {
          data: {
            title: "Data",
            icon: DatabaseIcon,
            component: DataSourcesPanel,
            placement: "sidebar",
          },
          main: {
            title: "Main view",
            icon: () => null,
            component: MainView,
            placement: "main",
          },
        },
      },
    })(set, get, store),

    ...createMosaicSlice()(set, get, store),

    ...createMapSettingsSlice()(set, get, store),

    // Data stores
    countriesGeoMap: null,
    setCountriesGeoMap: (map) => set({ countriesGeoMap: map }),
  }),
  // ),
);
