import { useRoomStore } from "@/store";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ArrowRight } from "lucide-react";

const CountryToggle = () => {
  const showCountryPoints = useRoomStore((state) => state.showCountryPoints);
  const setShowCountryPoints = useRoomStore(
    (state) => state.setShowCountryPoints,
  );
  const enableControls = useRoomStore((state) => state.enableControls);

  return (
    <div
      className="flex flex-col gap-1"
      id="show-controls"
      // style={{
      //   opacity: 0,
      //   visibility: "hidden",
      // }}
    >
      {/* <div className="text-sm pl-1 text-stone-500">show countries</div> */}
      <ToggleGroup
        value={showCountryPoints}
        onValueChange={(val) => {
          if (val.length > 0) setShowCountryPoints(val);
        }}
        style={{
          pointerEvents: enableControls ? "auto" : "none",
        }}
      >
        <ToggleGroupItem
          value="sending"
          aria-label=""
          // className="flex gap-2 items-center border-2 border-black"
          className="flex gap-2 items-center"
        >
          {/* <div className="size-4 rounded-full bg-[#dea193]"></div> */}
          <div className="text-lg">sent</div>
        </ToggleGroupItem>
        <ArrowRight className="stroke-stone-500 scale-y-100" />
        <ToggleGroupItem
          value="receiving"
          aria-label=""
          // className="flex gap-2 items-center border-2 border-white"
          className="flex gap-2 items-center"
        >
          <div className="text-lg">received</div>
          {/* <div className="size-4 rounded-full bg-[#dea193]"></div> */}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default CountryToggle;
