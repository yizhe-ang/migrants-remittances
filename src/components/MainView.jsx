import useDataPreparation from "@/components/data/useDataPreparation";
import useDataProcessing from "@/components/data/useDataProcessing";
import Three from "@/components/three/Three";
import useScales from "@/components/data/useScales";
import CountryTooltip from "@/components/interface/CountryTooltip";
import ScrollyTelling from "@/components/ScrollyTelling";

const MainView = () => {
  useDataPreparation();

  useDataProcessing();

  useScales();

  return (
    <>
      <div className="fixed inset-0 bg-stone-200 z-10">
        <Three />
      </div>

      <ScrollyTelling />

      <CountryTooltip />
    </>
  );
};

export default MainView;
