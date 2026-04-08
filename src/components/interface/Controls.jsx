import { useRoomStore } from "@/store";
import { LegendOrdinal } from "@visx/legend";
import CountryToggle from "./CountryToggle";
import { Toggle } from "@/components/ui/toggle";
import CurvedArrow from "./CurvedArrow";
import colors from "tailwindcss/colors";

const Controls = () => {
  const pointsValue = useRoomStore((state) => state.pointsValue);
  const setPointsValue = useRoomStore((state) => state.setPointsValue);
  const colorPointsBy = useRoomStore((state) => state.colorPointsBy);
  const setColorPointsBy = useRoomStore((state) => state.setColorPointsBy);

  const incomeColorScale = useRoomStore((state) => state.incomeColorScale);
  const remFromColorScale = useRoomStore((state) => state.remFromColorScale);
  const remToColorScale = useRoomStore((state) => state.remToColorScale);

  return (
    <div className="fixed inset-0 pointer-events-none pt-6">
      <div className="w-full max-w-4xl mx-auto px-10 py-4 pointer-events-auto flex flex-col gap-5">
        {/* Map title */}
        <div
          className="flex gap-2 w-full text-lg pt-5 items-center"
          id="show-controls"
          style={{
            opacity: 0,
            visibility: "hidden",
          }}
        >
          <div className="font-bold">Money</div>
          <div className="relative">
            <CountryToggle />
            <CurvedArrow
              className="absolute top-5 left-0"
              end={{ x: -100, y: 0 }}
              start={{ x: 0, y: 120 }}
              curve={-80}
              color={colors.stone[400]}
              startLabel="Toggle between countries sending or receiving money"
              startLabelClassName="font-cursive translate-x-6"
            />
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
            className="flex gap-1"
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
