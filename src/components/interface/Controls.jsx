import { useRoomStore } from "@/store";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  LegendItem,
  LegendLabel,
  LegendOrdinal,
  LegendSize,
} from "@visx/legend";
import { AnimatePresence, motion } from "motion/react";
import DateSlider from "@/components/interface/DateSlider";

const Controls = () => {
  const showCountryPoints = useRoomStore((state) => state.showCountryPoints);
  const setShowCountryPoints = useRoomStore(
    (state) => state.setShowCountryPoints,
  );
  const pointsValue = useRoomStore((state) => state.pointsValue);
  const setPointsValue = useRoomStore((state) => state.setPointsValue);
  const colorPointsBy = useRoomStore((state) => state.colorPointsBy);
  const setColorPointsBy = useRoomStore((state) => state.setColorPointsBy);

  const incomeColorScale = useRoomStore((state) => state.incomeColorScale);
  const remRadiusScale = useRoomStore((state) => state.remRadiusScale);
  const propsGdpRadiusScale = useRoomStore(
    (state) => state.propsGdpRadiusScale,
  );

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="w-full px-10 py-4 pointer-events-auto flex gap-5">
        <div
          className="flex flex-col gap-1"
          id="show-controls"
          style={{
            // opacity: 0,
            // visibility: "hidden",
          }}
        >
          <div className="text-sm pl-1 text-stone-500">show countries</div>
          <ToggleGroup
            value={showCountryPoints}
            onValueChange={(val) => {
              if (val.length > 0) setShowCountryPoints(val);
            }}
          >
            <ToggleGroupItem
              value="sending"
              aria-label=""
              className="flex gap-1 items-center"
            >
              <div className="size-4 rounded-full bg-orange-300"></div>
              <div>Sending</div>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="receiving"
              aria-label=""
              className="flex gap-1 items-center"
            >
              <div className="size-4 rounded-full bg-blue-300"></div>
              <div>Receiving</div>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div
          className="flex flex-col gap-1 w-[180px]"
          id="color-controls"
          style={{
            // opacity: 0,
            // visibility: "hidden",
          }}
        >
          <div className="text-sm pl-1 text-stone-500">color by</div>
          <ToggleGroup
            value={colorPointsBy}
            onValueChange={(val) => {
              if (val.length > 0) setColorPointsBy(val);
            }}
          >
            <ToggleGroupItem value="value" aria-label="">
              $
            </ToggleGroupItem>
            <ToggleGroupItem value="income" aria-label="">
              Income
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Color scale */}
          <div className="mt-2 pl-1">
            <AnimatePresence>
              {incomeColorScale && colorPointsBy[0] === "income" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <LegendOrdinal
                    scale={incomeColorScale}
                    className="text-sm"
                  ></LegendOrdinal>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div
          className="flex flex-col gap-1"
          id="size-controls"
          style={{
            // opacity: 0,
            // visibility: "hidden",
          }}
        >
          <div className="text-sm pl-1 text-stone-500">size represents</div>
          <ToggleGroup
            value={pointsValue}
            onValueChange={(val) => {
              if (val.length > 0) setPointsValue(val);
            }}
          >
            <ToggleGroupItem value="absolute" aria-label="">
              Absolute
            </ToggleGroupItem>
            <ToggleGroupItem value="propGdp" aria-label="">
              % of GDP
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="absolute top-30 w-full pb-10 pointer-events-auto">
        <DateSlider />
      </div>
    </div>
  );
};

export default Controls;
