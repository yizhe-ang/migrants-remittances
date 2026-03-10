import { useRoomStore } from "@/store";
import { useSql } from "@sqlrooms/duckdb";
import { useMemo } from "react";
import { SpinnerPane } from "@sqlrooms/ui";
import useDataPreparation from "@/components/data/useDataPreparation";
import Notebook from "@/components/notebook/Notebook";
import useDataProcessing from "@/components/data/useDataProcessing";
import DeckGLMap from "@/components/deckgl/DeckGLMap";
import Three from "@/components/three/Three";
import useScales from "@/components/data/useScales";

const MainView = () => {
  useDataPreparation();

  const {
    migAndRemAvgYear,
    disasters,
    disastersByCountry,
    disastersImpactsByMonth,
    migAndRemByIncome,
    migAndRemByRegion,
    migAndRemByDestination,
    migAndRemByOrigin,
    flowsByOrigin,
    flowsPerYear,
    countriesStats,
  } = useDataProcessing();

  useScales()

  return (
    <>
      {/* {migAndRemByDestination &&
        migAndRemByOrigin &&
        migAndRemAvgYear &&
        disasters &&
        disastersByCountry &&
        flowsByOrigin && (
          <DeckGLMap
            migAndRemByDestination={migAndRemByDestination.toArray()}
            migAndRemByOrigin={migAndRemByOrigin.toArray()}
            migAndRemAvgYear={migAndRemAvgYear.toArray()}
            disasters={disasters.toArray()}
            disastersByCountry={disastersByCountry.toArray()}
            flowsByOrigin={flowsByOrigin
              .toArray()
              .filter((d) => d.year === 2019)}
          />
        )} */}

      {/* <Notebook
        migAndRemAvgYear={migAndRemAvgYear}
        disasters={disasters}
        disastersImpactsByMonth={disastersImpactsByMonth}
        migAndRemByIncome={migAndRemByIncome}
        migAndRemByRegion={migAndRemByRegion}
        migAndRemByDestination={migAndRemByDestination}
        migAndRemByOrigin={migAndRemByOrigin}
        flowsPerYear={flowsPerYear}
        countriesStats={countriesStats}
      /> */}

      <div className="fixed inset-0 bg-stone-200">
        <Three />
      </div>
    </>
  );
};

export default MainView;
