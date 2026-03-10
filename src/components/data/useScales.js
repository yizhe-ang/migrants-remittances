import { useRoomStore } from "@/store";
import { max } from "d3-array";
import { scaleSqrt } from "d3-scale";
import { useEffect } from "react";

export default function useScales() {
  const flowsByOrigin = useRoomStore((state) => state.flowsByOrigin);
  const flowsByDestination = useRoomStore((state) => state.flowsByDestination);

  const setRemRadiusScale = useRoomStore((state) => state.setRemRadiusScale);

  useEffect(() => {
    if (!flowsByOrigin || !flowsByDestination) return;

    // TODO: use log scale or sth for this?

    const remRadiusScale = scaleSqrt()
      .domain([
        0,
        max(
          [...flowsByDestination, ...flowsByOrigin],
          (d) => d.sim_remittances_with,
        ),
      ])
      .range([0, 10]);

    setRemRadiusScale(remRadiusScale);
  }, [flowsByDestination, flowsByOrigin]);
}
