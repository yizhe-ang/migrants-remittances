import { useRoomStore } from "@/store";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LegendOrdinal } from "@visx/legend";
import { AnimatePresence, motion } from "motion/react";
import DateSlider from "@/components/interface/DateSlider";
import CountryToggle from "./CountryToggle";
import { Toggle } from "@/components/ui/toggle";

const Controls = () => {
  const pointsValue = useRoomStore((state) => state.pointsValue);
  const setPointsValue = useRoomStore((state) => state.setPointsValue);
  const colorPointsBy = useRoomStore((state) => state.colorPointsBy);
  const setColorPointsBy = useRoomStore((state) => state.setColorPointsBy);

  const incomeColorScale = useRoomStore((state) => state.incomeColorScale);
  const remFromColorScale = useRoomStore((state) => state.remFromColorScale);
  const remToColorScale = useRoomStore((state) => state.remToColorScale);

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="w-full max-w-4xl mx-auto px-10 py-4 pointer-events-auto flex flex-col gap-5">
        <div className="flex gap-2 w-full text-lg pt-5 items-center">
          <div className="">Money</div>
          <CountryToggle />
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
            className="flex gap-1"
            id="size-controls"
            // style={{
            //   opacity: 0,
            //   visibility: "hidden",
            // }}
          >
            {/* <div className="text-sm pl-1 text-stone-500">size represents</div> */}
            <Toggle
              className="text-lg"
              pressed={pointsValue[0] === "propGdp"}
              onPressedChange={(val) => {
                setPointsValue(val ? ["propGdp"] : ["absolute"]);
              }}
            >
              as % of GDP
            </Toggle>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;
