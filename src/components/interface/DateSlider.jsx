import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { useRoomStore } from "@/store";

const START_YEAR = 2010;
const END_YEAR = 2019;
const TOTAL_MONTHS = (END_YEAR - START_YEAR + 1) * 12;

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function indexToLabel(index) {
  const year = START_YEAR + Math.floor(index / 12);
  const month = index % 12;
  return `${MONTH_NAMES[month]} ${year}`;
}

const DateSlider = () => {
  const [value, setValue] = useState([TOTAL_MONTHS - 1]);
  const setSelectedYear = useRoomStore((state) => state.setSelectedYear);

  const handleValueChange = (val) => {
    const index = Array.isArray(val) ? val[0] : val;
    setValue([index]);
    const year = START_YEAR + Math.floor(index / 12);
    setSelectedYear(year);
  };

  return (
    <div className="mx-auto w-full max-w-xs flex flex-col gap-2 items-center">
      <div className="text-sm text-stone-500">{indexToLabel(value[0])}</div>
      <Slider
        value={value}
        onValueChange={handleValueChange}
        min={0}
        max={TOTAL_MONTHS - 1}
        step={1}
        className="w-full"
      />
    </div>
  );
};

export default DateSlider;
