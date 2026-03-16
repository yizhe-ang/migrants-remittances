import useDataPreparation from "@/components/data/useDataPreparation";
import useDataProcessing from "@/components/data/useDataProcessing";
import Three from "@/components/three/Three";
import useScales from "@/components/data/useScales";
import CountryTooltip from "@/components/interface/CountryTooltip";
import ScrollyTelling from "@/components/ScrollyTelling";
import { ParentSize } from "@visx/responsive";
import SankeyIncome from "@/components/vis/SankeyIncome";
import Steps from "@/components/Steps";

const MainView = () => {
  useDataPreparation();

  useDataProcessing();

  useScales();

  return (
    <>
      <div className="fixed inset-0 bg-stone-200 z-10">
        <Three />
      </div>

      {/* Sankey income */}
      {/* <div className="fixed inset-0 grid place-items-center pointer-events-none">
        <div className="h-[80vh]">
          <ParentSize>
            {({ height }) => <SankeyIncome width={500} height={height} />}
          </ParentSize>
        </div>
      </div>

      <Steps />

      <ScrollyTelling /> */}

      <CountryTooltip />
    </>
  );
};

export default MainView;
