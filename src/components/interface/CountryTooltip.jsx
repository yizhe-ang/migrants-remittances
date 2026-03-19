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
      <AnimatePresence>
        {hoveredCountry && (
          <motion.div
            key="country-tooltip"
            ref={ref}
            className="pointer-events-none fixed z-50 w-fit rounded-xl bg-stone-50 px-5 py-2 text-sm text-stone-900 shadow-lg left-1/2 bottom-0 -translate-x-1/2"
            initial={{ opacity: 0, y: 200 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 200 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="">
              <span className="font-bold text-2xl">
                {hoveredCountry.country}
              </span>{" "}
            </div>

            <div className="text-stone-500">
              <span className="text-stone-500">
                in {selectedYear}{" "}
                {hoveredCountry.type === "origin" ? "received" : "sent"}
              </span>{" "}
              <span className="font-bold text-xl tabular-nums text-stone-950">
                {moneyFormat.format(d.sim_remittances_with)}
              </span>{" "}
              {hoveredCountry.type === "origin" ? "from" : "to"}
            </div>
            <div className="mt-2 grid w-fit grid-cols-[auto_auto] gap-x-4">
              {flows?.map((d, i) => (
                <div key={i} className="contents">
                  <div>
                    <span className="text-stone-400">{i + 1}.</span>{" "}
                    {hoveredCountry.type === "origin"
                      ? d.destination
                      : d.origin}{" "}
                  </div>
                  <div className="font-medium text-stone-950 tabular-nums text-right">
                    {moneyFormat.format(d.sim_remittances_with)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CountryTooltip;
