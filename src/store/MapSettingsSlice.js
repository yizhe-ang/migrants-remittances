import { createSlice } from "@sqlrooms/room-shell";
import { produce } from "immer";
import { z } from "zod";

export const MapSettingsConfig = z.object({
  enableBrushing: z.boolean().default(false),
  syncCharts: z.boolean().default(true),
  brushRadius: z.number().default(50000),
});

export function createDefaultMapSettingsConfig(props) {
  return {
    enableBrushing: false,
    syncCharts: true,
    brushRadius: 50000,
    ...props,
  };
}

export function createMapSettingsSlice(props) {
  return createSlice((set, _get, _store) => ({
    mapSettings: {
      config: createDefaultMapSettingsConfig(props?.config),
      setEnableBrushing: (enabled) => {
        set((state) =>
          produce(state, (draft) => {
            draft.mapSettings.config.enableBrushing = enabled;
          }),
        );
      },
      setSyncCharts: (sync) => {
        set((state) =>
          produce(state, (draft) => {
            draft.mapSettings.config.syncCharts = sync;
          }),
        );
      },
      setBrushRadius: (radius) => {
        set((state) =>
          produce(state, (draft) => {
            draft.mapSettings.config.brushRadius = radius;
          }),
        );
      },
    },
  }));
}
