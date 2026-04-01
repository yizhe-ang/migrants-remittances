import useDataPreparation from "@/components/data/useDataPreparation";
import useDataProcessing from "@/components/data/useDataProcessing";
import Three from "@/components/three/Three";
import useScales from "@/components/data/useScales";
import CountryTooltip from "@/components/interface/CountryTooltip";
import ScrollyTelling from "@/components/ScrollyTelling";
import { ParentSize } from "@visx/responsive";
import SankeyIncome from "@/components/vis/SankeyIncome";
import Steps from "@/components/Steps";
import Controls from "@/components/interface/Controls";
import BeeswarmDisasters from "@/components/vis/BeeswarmDisasters";
import BeeswarmDisastersNew from "@/components/vis/BeeswarmDisastersNew";
import AreaDisasters from "@/components/vis/AreaDisasters";
import RectDisasters from "@/components/vis/RectDisasters";
import RectDisastersNew from "./vis/RectDisastersNew";
import { useEffect } from "react";
import { useRoomStore } from "@/store";

const MainView = () => {
  // const dashboardView = useRoomStore((state) => state.dashboardView);
  // const setDashboardView = useRoomStore((state) => state.setDashboardView);
  // const setEnableMapInteractions = useRoomStore(
  //   (state) => state.setEnableMapInteractions
  // )

  // useEffect(() => {
  //   const path = window.location.pathname;

  //   if (path === "/dashboard") {
  //     // setDashboardView(true)
  //     // setEnableMapInteractions(true)
  //     window.scrollTo(0, document.body.scrollHeight);
  //   }
  // }, []);

  useDataPreparation();

  useDataProcessing();

  useScales();

  return (
    <>
      <div className="fixed inset-0 bg-stone-100 -z-10">
        <Three />
      </div>

      {/* {!dashboardView && ( */}
      <>
        {/* Sankey income */}
        <div className="fixed inset-0 grid place-items-center pointer-events-none">
          <div className="h-[80vh] w-[600px]">
            <ParentSize>
              {({ height }) => <SankeyIncome width={600} height={height} />}
            </ParentSize>
          </div>
        </div>

        <div className="fixed inset-0 grid place-items-center pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ opacity: 0, visibility: "hidden" }}
            id="beeswarm-disasters"
          >
            <BeeswarmDisastersNew />
          </div>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ opacity: 0, visibility: "hidden" }}
            id="area-disasters"
          >
            <div className="h-[80vh] w-[700px]">
              <ParentSize>
                {({ height, width }) => (
                  <AreaDisasters width={width} height={height} />
                )}
              </ParentSize>
            </div>
          </div>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ opacity: 0, visibility: "hidden" }}
            id="rect-disasters"
          >
            <RectDisasters />
            {/* <RectDisastersNew /> */}
          </div>
        </div>

        <Steps />

        <ScrollyTelling />
      </>
      {/* )} */}

      <Controls />

      <CountryTooltip />
    </>
  );
};

export default MainView;
