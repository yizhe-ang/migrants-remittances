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
import DisastersChart from "@/components/vis/DisastersChart";
import Header from "./Header";
import ScrollIndicator from "./ScrollIndicator";
import LoadingScreen from "@/components/LoadingScreen";
import { useRoomStore } from "@/store";

const MainView = () => {
  const showLoadingScreen = useRoomStore((state) => state.showLoadingScreen);
  const bootStage = useRoomStore((state) => state.bootStage);

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
    <div className="relative">
      <Header />

      <ScrollIndicator />

      <div className="fixed inset-0 z-0 bg-stone-100">
        <Three />
      </div>

      <LoadingScreen stage={bootStage} visible={showLoadingScreen} />

      {/* {!dashboardView && ( */}
      <>
        {/* Sankey income */}
        <div className="fixed inset-0 z-10 grid place-items-center pointer-events-none">
          <div className="h-[80vh] w-screen max-w-[800px] pointer-events-none">
            <ParentSize>
              {({ height, width }) => (
                <SankeyIncome width={width} height={height} />
              )}
            </ParentSize>
          </div>
        </div>

        <div className="fixed inset-0 z-10 grid place-items-center pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ opacity: 0, visibility: "hidden" }}
            id="beeswarm-disasters"
          >
            <DisastersChart />
          </div>
        </div>

        <div
          className="fixed inset-0 z-10 pointer-events-none bg-stone-50/30 backdrop-blur-sm invisible"
          id="overlay"
        ></div>

        <Steps />

        <ScrollyTelling />
      </>
      {/* )} */}

      <Controls />

      <CountryTooltip />
    </div>
  );
};

export default MainView;
