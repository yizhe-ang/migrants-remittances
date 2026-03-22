import { useMemo, useRef } from "react";
import { useRoomStore } from "@/store";
import { AnimatePresence, motion } from "motion/react";
import { moneyFormat, percentFormat } from "@/lib/utils";

const CountryTooltip = () => {
  const ref = useRef(null);
  const hoveredCountry = useRoomStore((state) => state.hoveredCountry);
  const points = useRoomStore((state) => state.points);
  const selectedYear = useRoomStore((state) => state.selectedYear);
  const flowsMap = useRoomStore((state) => state.flowsMap);
  const pointsValue = useRoomStore((state) => state.pointsValue);
  const incomeColorScale = useRoomStore((state) => state.incomeColorScale);
  const enableMapInteractions = useRoomStore(
    (state) => state.enableMapInteractions,
  )

  const accessor = useMemo(() => {
    if (pointsValue[0] === "absolute") {
      return (d) => d.sim_remittances_with;
    }
    if (pointsValue[0] === "propGdp") {
      return (d) => d.prop_of_gdp;
    }
  }, [pointsValue]);

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
        {enableMapInteractions && hoveredCountry && (
          <motion.div
            key="country-tooltip"
            ref={ref}
            className="pointer-events-none fixed z-50 w-fit rounded-xl bg-stone-50 px-6 py-2 text-sm text-stone-900 shadow-lg left-1/2 bottom-0 -translate-x-1/2 pb-4"
            initial={{ opacity: 0, y: 200 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 200 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="">
              <span
                className="font-bold text-2xl px-2"
                style={{
                  background: incomeColorScale
                    ? `${incomeColorScale(d.income)}80`
                    : "transparent",
                }}
              >
                {hoveredCountry.country}
              </span>{" "}
            </div>

            <div className="text-stone-500">
              <span className="text-stone-500">
                in {selectedYear}{" "}
                {hoveredCountry.type === "origin" ? "received" : "sent"}
              </span>{" "}
              {pointsValue[0] === "absolute" ? (
                <span className="font-bold text-xl tabular-nums text-stone-950">
                  {moneyFormat.format(accessor(d))}
                </span>
              ) : (
                <>
                  <span className="font-bold text-xl tabular-nums text-stone-950">
                    {percentFormat(accessor(d))}
                  </span>{" "}
                  <span>of its GDP</span>
                </>
              )}{" "}
              {hoveredCountry.type === "origin" ? "from" : "to"}
            </div>

            {pointsValue[0] !== "propGdp" && (
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
                      {moneyFormat.format(accessor(d))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CountryTooltip;
