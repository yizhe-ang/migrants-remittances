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

    // Data stores #############################################################
    countriesGeo: null,
    setCountriesGeo: (countriesGeo) => set({ countriesGeo }),

    countriesGeoMap: null,
    setCountriesGeoMap: (map) => set({ countriesGeoMap: map }),

    countriesAggStatsMap: null,
    setCountriesAggStatsMap: (map) => set({ countriesAggStatsMap: map }),

    flowsPerYear: null,
    setFlowsPerYear: (flowsPerYear) => set({ flowsPerYear }),

    selectedFlows: null,
    setSelectedFlows: (selectedFlows) => set({ selectedFlows }),

    flowsMap: null,
    setFlowsMap: (flowsMap) => set({ flowsMap }),

    flowsByIncome: null,
    setFlowsByIncome: (flowsByIncome) => set({ flowsByIncome }),

    flowsByOrigin: null,
    setFlowsByOrigin: (flowsByOrigin) => set({ flowsByOrigin }),

    flowsByDestination: null,
    setFlowsByDestination: (flowsByDestination) => set({ flowsByDestination }),

    // Scales ##################################################################
    remRadiusScale: null,
    setRemRadiusScale: (scale) => set({ remRadiusScale: scale }),

    propGdpRadiusScale: null,
    setPropGdpRadiusScale: (scale) => set({ propGdpRadiusScale: scale }),

    remFromColorScale: null,
    setRemFromColorScale: (scale) => set({ remFromColorScale: scale }),

    remToColorScale: null,
    setRemToColorScale: (scale) => set({ remToColorScale: scale }),

    flowRadiusScale: null,
    setFlowRadiusScale: (scale) => set({ flowRadiusScale: scale }),

    incomeColorScale: null,
    setIncomeColorScale: (scale) => set({ incomeColorScale: scale }),

    // Data vis ########################################################
    sankeyIncome: null,
    setSankeyIncome: (sankeyIncome) => set({ sankeyIncome }),

    // Controls / Interactions #################################################
    enableMapInteractions: false,
    setEnableMapInteractions: (enableInteractions) =>
      set({ enableInteractions }),

    selectedYear: 2019,
    setSelectedYear: (selectedYear) => set({ selectedYear }),

    hoveredCountry: null,
    setHoveredCountry: (hoveredCountry) => set({ hoveredCountry }),

    selectedCountry: null,
    setSelectedCountry: (selectedCountry) => set({ selectedCountry }),

    mousePosition: { x: 0, y: 0 },
    setMousePosition: (mousePosition) => set({ mousePosition }),

    // Scene objects ###########################################################
    cameraControls: null,
    setCameraControls: (cameraControls) => set({ cameraControls }),

    points: null,
    setPoints: (points) => set({ points }),

    arcs: null,
    setArcs: (arcs) => set({ arcs }),
  }),
  // ),
);
