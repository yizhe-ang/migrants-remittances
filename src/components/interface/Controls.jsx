import { useRoomStore } from "@/store";
import { LegendOrdinal } from "@visx/legend";
import CountryToggle from "./CountryToggle";
import { Toggle } from "@/components/ui/toggle";
import CurvedArrow from "./CurvedArrow";
import colors from "tailwindcss/colors";
import { AnimatePresence, motion } from "motion/react";
import { MousePointerClick } from "lucide-react";

const Controls = () => {
  const pointsValue = useRoomStore((state) => state.pointsValue);
  const setPointsValue = useRoomStore((state) => state.setPointsValue);

  const incomeColorScale = useRoomStore((state) => state.incomeColorScale);

  const showToggleCountryPrompt = useRoomStore(
    (state) => state.showToggleCountryPrompt,
  );
  const showHoverCountryPrompt = useRoomStore(
    (state) => state.showHoverCountryPrompt,
  );

  const showToggleValuesPrompt = useRoomStore(
    (state) => state.showToggleValuesPrompt,
  );
  const setShowToggleValuesPrompt = useRoomStore(
    (state) => state.setShowToggleValuesPrompt,
  );

  return (
    <div className="fixed inset-0 pointer-events-none pt-6">
      <div className="w-full max-w-4xl mx-auto px-10 py-4 pointer-events-auto flex flex-col gap-5">
        {/* Map title */}
        <div
          className="flex gap-2 w-full text-lg pt-5 items-center relative"
          id="show-controls"
          style={{
            opacity: 0,
            visibility: "hidden",
          }}
        >
          <AnimatePresence>
            {showHoverCountryPrompt && (
              <motion.div
                className="absolute right-5 top-40 font-cursive w-60 text-shadow-lg/20 text-shadow-stone-900 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Hover over each country to see their remittance flows
                <MousePointerClick className="animate-bounce absolute top-0 left-0 -translate-y-[70%] -translate-x-[90%]" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="font-bold">Money</div>
          <div className="relative">
            <CountryToggle />

            {/* <AnimatePresence>
              {showToggleCountryPrompt && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CurvedArrow
                    className="absolute top-5 left-0"
                    end={{ x: -100, y: 0 }}
                    start={{ x: 0, y: 120 }}
                    curve={-80}
                    color={colors.stone[900]}
                    startLabel="Toggle between countries sending or receiving money"
                    startLabelClassName="font-cursive translate-x-6 text-shadow-lg/20 text-shadow-stone-900"
                  />
                </motion.div>
              )}
            </AnimatePresence> */}
            <AnimatePresence>
              {showToggleCountryPrompt && (
                <motion.div
                  className="absolute left-5 top-12 font-cursive w-35 text-shadow-lg/20 text-shadow-stone-900 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Toggle between countries sending or receiving money
                  <MousePointerClick className="animate-bounce absolute top-0 left-0 -translate-y-[80%] translate-x-[-100%]" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            by{" "}
            <div className="relative inline-block">
              <span className="font-bold">countries</span>
              {/* Color scale */}
              {incomeColorScale && (
                <div className="absolute top-8 left-0 w-max">
                  <LegendOrdinal
                    scale={incomeColorScale}
                    className="text-sm"
                  ></LegendOrdinal>
                </div>
              )}
            </div>{" "}
            around the world in 2019
          </div>
          <div
            className="flex gap-1 relative"
            id="size-controls"
            style={{
              opacity: 0,
              visibility: "hidden",
            }}
          >
            {/* <div className="text-sm pl-1 text-stone-500">size represents</div> */}
            <Toggle
              // className="text-lg
              // aria-pressed:bg-[repeating-linear-gradient(-45deg,#f5f5f4_0px,#f5f5f4_6px,#d6d3d1_4px,#d6d3d1_8px)]
              // "
              className="text-lg
              "
              pressed={pointsValue[0] === "propGdp"}
              onPressedChange={(val) => {
                setShowToggleValuesPrompt(false);
                setPointsValue(val ? ["propGdp"] : ["absolute"]);
              }}
            >
              as % of GDP
            </Toggle>
            <AnimatePresence>
              {showToggleValuesPrompt && (
                <motion.div
                  className="absolute right-0 top-12 font-cursive w-35 text-shadow-lg/20 text-shadow-stone-900 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Toggle between absolute or % values
                  <MousePointerClick className="animate-bounce absolute top-0 right-0 -translate-y-[80%] translate-x-[-30%]" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;
