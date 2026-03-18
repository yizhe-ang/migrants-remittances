import { useRoomStore } from "@/store";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const Controls = () => {
  const showCountryPoints = useRoomStore((state) => state.showCountryPoints);
  const setShowCountryPoints = useRoomStore(
    (state) => state.setShowCountryPoints,
  );
  const pointsValue = useRoomStore((state) => state.pointsValue);
  const setPointsValue = useRoomStore((state) => state.setPointsValue);
  const colorPointsBy = useRoomStore((state) => state.colorPointsBy);
  const setColorPointsBy = useRoomStore((state) => state.setColorPointsBy);

  return (
    <div className="absolute w-full h-full top-0 left-0 pointer-events-none">
      <div className="w-full px-10 py-4 pointer-events-auto flex gap-5">
        <div className="flex flex-col gap-1">
          <div className="text-sm pl-1 text-stone-500">show countries</div>
          <ToggleGroup
            variant="outline"
            multiple
            value={showCountryPoints}
            onValueChange={setShowCountryPoints}
          >
            <ToggleGroupItem value="sending" aria-label="">
              Sending
            </ToggleGroupItem>
            <ToggleGroupItem value="receiving" aria-label="">
              Receiving
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex flex-col gap-1">
          <div className="text-sm pl-1 text-stone-500">size represents</div>
          <ToggleGroup
            variant="outline"
            value={pointsValue}
            onValueChange={setPointsValue}
          >
            <ToggleGroupItem value="absolute" aria-label="">
              Absolute
            </ToggleGroupItem>
            <ToggleGroupItem value="propGdp" aria-label="">
              % of GDP
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex flex-col gap-1">
          <div className="text-sm pl-1 text-stone-500">color by</div>
          <ToggleGroup
            variant="outline"
            value={colorPointsBy}
            onValueChange={setColorPointsBy}
          >
            <ToggleGroupItem value="value" aria-label="">
              $
            </ToggleGroupItem>
            <ToggleGroupItem value="income" aria-label="">
              Income
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
};

export default Controls;
