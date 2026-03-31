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
import AreaDisasters from "@/components/vis/AreaDisasters";
import RectDisasters from "@/components/vis/RectDisasters";
import RectDisastersNew from "./vis/RectDisastersNew";

const MainView = () => {
  useDataPreparation();

  useDataProcessing();

  useScales();

  return (
    <>
      <div className="fixed inset-0 bg-stone-100 -z-10">
        <Three />
      </div>

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
          <div className="h-[80vh] w-[700px]">
            <ParentSize>
              {({ height, width }) => (
                <BeeswarmDisasters width={width} height={height} />
              )}
            </ParentSize>
          </div>
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

      <Controls />

      <CountryTooltip />
    </>
  );
};

export default MainView;
