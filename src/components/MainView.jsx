import useDataPreparation from "@/components/data/useDataPreparation";
import useDataProcessing from "@/components/data/useDataProcessing";
import Three from "@/components/three/Three";
import useScales from "@/components/data/useScales";
import CountryTooltip from "@/components/interface/CountryTooltip";
import ScrollyTelling from "@/components/ScrollyTelling";
import { ParentSize } from "@visx/responsive";
import SankeyIncome from "@/components/vis/SankeyIncome";

const MainView = () => {
  useDataPreparation();

  useDataProcessing();

  useScales();

  return (
    <>
      {/* <div className="fixed inset-0 bg-stone-200 -z-10">
        <Three />
      </div>

      <ScrollyTelling /> */}

      <div className="fixed inset-0 z-10 grid place-items-center">
        <div className="h-[80vh]">
          <ParentSize>
            {({ height }) => (
              <SankeyIncome width={500} height={height} />
            )}
          </ParentSize>
        </div>
      </div>

      <CountryTooltip />
    </>
  );
};

export default MainView;
