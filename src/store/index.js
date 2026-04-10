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

    flowsMap2019: null,
    setFlowsMap2019: (flowsMap2019) => set({ flowsMap2019 }),

    flowsByIncome: null,
    setFlowsByIncome: (flowsByIncome) => set({ flowsByIncome }),

    flowsByOrigin: null,
    setFlowsByOrigin: (flowsByOrigin) => set({ flowsByOrigin }),

    flowsByDestination: null,
    setFlowsByDestination: (flowsByDestination) => set({ flowsByDestination }),

    disasters: null,
    setDisasters: (disasters) => set({ disasters }),

    disastersImpactsByMonth: null,
    setDisastersImpactsByMonth: (disastersImpactsByMonth) =>
      set({ disastersImpactsByMonth }),

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

    flowPropRadiusScale: null,
    setFlowPropRadiusScale: (scale) => set({ flowPropRadiusScale: scale }),

    incomeColorScale: null,
    setIncomeColorScale: (scale) => set({ incomeColorScale: scale }),

    propGdpFromColorScale: null,
    setPropGdpFromColorScale: (scale) => set({ propGdpFromColorScale: scale }),

    propGdpToColorScale: null,
    setPropGdpToColorScale: (scale) => set({ propGdpToColorScale: scale }),

    disasterTypeColorScale: null,
    setDisasterTypeColorScale: (scale) =>
      set({ disasterTypeColorScale: scale }),

    disastersRadiusScale: null,
    setDisastersRadiusScale: (scale) => set({ disastersRadiusScale: scale }),

    // Data vis ########################################################
    sankeyIncome: null,
    setSankeyIncome: (sankeyIncome) => set({ sankeyIncome }),

    // Controls / Interactions #################################################
    enableMapInteractions: false,
    setEnableMapInteractions: (enableMapInteractions) =>
      set({ enableMapInteractions }),

    enableControls: true,
    setEnableControls: (enableControls) => set({ enableControls }),

    selectedYear: 2019,
    setSelectedYear: (selectedYear) => set({ selectedYear }),

    hoveredCountry: null,
    setHoveredCountry: (hoveredCountry) => set({ hoveredCountry }),

    selectedCountry: null,
    setSelectedCountry: (selectedCountry) => set({ selectedCountry }),

    mousePosition: { x: 0, y: 0 },
    setMousePosition: (mousePosition) => set({ mousePosition }),

    showCountryPoints: ["receiving"],
    setShowCountryPoints: (showCountryPoints) => set({ showCountryPoints }),

    pointsValue: ["absolute"],
    // pointsValue: ["propGdp"],
    setPointsValue: (pointsValue) => set({ pointsValue }),

    // colorPointsBy: ["value"],
    colorPointsBy: ["income"],
    setColorPointsBy: (colorPointsBy) => set({ colorPointsBy }),

    dashboardView: false,
    setDashboardView: (dashboardView) => set({ dashboardView }),

    showToggleCountryPrompt: true,
    setShowToggleCountryPrompt: (showToggleCountryPrompt) =>
      set((state) =>
        state.showToggleCountryPrompt === showToggleCountryPrompt
          ? state
          : { showToggleCountryPrompt },
      ),

    showHoverCountryPrompt: true,
    setShowHoverCountryPrompt: (showHoverCountryPrompt) =>
      set((state) =>
        state.showHoverCountryPrompt === showHoverCountryPrompt
          ? state
          : { showHoverCountryPrompt },
      ),

    showToggleValuesPrompt: true,
    setShowToggleValuesPrompt: (showToggleValuesPrompt) =>
      set((state) =>
        state.showToggleValuesPrompt === showToggleValuesPrompt
          ? state
          : { showToggleValuesPrompt },
      ),

    openAbout: false,
    setOpenAbout: (openAbout) => set({ openAbout }),

    // App boot / loading #####################################################
    dataSourcesReady: false,
    setDataSourcesReady: (dataSourcesReady) =>
      set((state) =>
        state.dataSourcesReady === dataSourcesReady ? state : { dataSourcesReady },
      ),

    derivedDataReady: false,
    setDerivedDataReady: (derivedDataReady) =>
      set((state) =>
        state.derivedDataReady === derivedDataReady ? state : { derivedDataReady },
      ),

    sceneReady: false,
    setSceneReady: (sceneReady) =>
      set((state) => (state.sceneReady === sceneReady ? state : { sceneReady })),

    isAppReady: false,
    setIsAppReady: (isAppReady) =>
      set((state) => (state.isAppReady === isAppReady ? state : { isAppReady })),

    showLoadingScreen: true,
    setShowLoadingScreen: (showLoadingScreen) =>
      set((state) =>
        state.showLoadingScreen === showLoadingScreen
          ? state
          : { showLoadingScreen },
      ),

    bootStage: "Loading data",
    setBootStage: (bootStage) =>
      set((state) => (state.bootStage === bootStage ? state : { bootStage })),

    // Scene objects ###########################################################
    cameraControls: null,
    setCameraControls: (cameraControls) => set({ cameraControls }),

    points: null,
    setPoints: (points) => set({ points }),

    arcs: null,
    setArcs: (arcs) => set({ arcs }),

    worldMap: null,
    setWorldMap: (worldMap) => set({ worldMap }),

    disasterPoints: null,
    setDisasterPoints: (disasterPoints) => set({ disasterPoints }),
  }),
  // ),
);
