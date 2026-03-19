import { useMemo, useRef } from "react";
import { useRoomStore } from "@/store";
import { AnimatePresence, motion } from "motion/react";
import { moneyFormat } from "@/lib/utils";

const OFFSET = 12;

const CountryTooltip = () => {
  const ref = useRef(null);
  const hoveredCountry = useRoomStore((state) => state.hoveredCountry);
  const mousePosition = useRoomStore((state) => state.mousePosition);
  const countriesGeoMap = useRoomStore((state) => state.countriesGeoMap);
  const points = useRoomStore((state) => state.points);
  const selectedYear = useRoomStore((state) => state.selectedYear);
  const flowsMap = useRoomStore((state) => state.flowsMap);

  // const geo = countriesGeoMap?.get(hoveredCountry.country);
  // const name = geo?.name ?? hoveredCountry.country;

  const w = ref.current?.offsetWidth ?? 0;
  const h = ref.current?.offsetHeight ?? 0;

  const fitsRight = mousePosition.x + OFFSET + w < window.innerWidth;
  const fitsBelow = mousePosition.y + OFFSET + h < window.innerHeight;

  const left = fitsRight
    ? mousePosition.x + OFFSET
    : mousePosition.x - OFFSET - w;
  const top = fitsBelow
    ? mousePosition.y + OFFSET
    : mousePosition.y - OFFSET - h;

  const d = useMemo(() => {
    if (!points || !hoveredCountry) return;

    const { country, type } = hoveredCountry;

    const d = points.dataIndex.get(type).get(country);

    return d;
  }, [points, hoveredCountry]);

  const flows = useMemo(() => {
    if (!flowsMap || !hoveredCountry) return;

    const { country, type } = hoveredCountry;

    const flows = flowsMap.get(type).get(country);

    // Sort flows
    const o = flows
      .map((d) => d.flow)
      .sort((d1, d2) => d2.sim_remittances_with - d1.sim_remittances_with);

    return o.slice(0, 5);
  }, [flowsMap, hoveredCountry]);

  return (
    <>
      {hoveredCountry && (
        <AnimatePresence>
          <motion.div
            ref={ref}
            className="pointer-events-none fixed z-50 rounded bg-stone-50 px-2.5 py-1.5 text-sm text-stone-900 shadow-lg"
            style={{ left, top }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="">
              <span className="font-bold text-xl">
                {hoveredCountry.country}
              </span>{" "}
              <span className="text-stone-500">
                in {selectedYear}{" "}
                {hoveredCountry.type === "origin" ? "received" : "sent"}
              </span>
            </div>
            <div className="text-stone-500">
              <span className="font-bold text-xl tabular-nums text-stone-950">
                {moneyFormat.format(d.sim_remittances_with)}
              </span>{" "}
              {hoveredCountry.type === "origin" ? "from" : "to"}
            </div>
            <div className="mt-2">
              {flows?.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <div className="w-[100px]">
                    <span className="text-stone-400">{i + 1}.</span>{" "}
                    {hoveredCountry.type === "origin"
                      ? d.destination
                      : d.origin}{" "}
                  </div>
                  <div className="font-medium text-stone-950 tabular-nums w-[55px] text-right">
                    {moneyFormat.format(d.sim_remittances_with)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
};

export default CountryTooltip;
