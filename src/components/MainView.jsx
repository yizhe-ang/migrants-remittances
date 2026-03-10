import { useRoomStore } from "@/store";
import { useSql } from "@sqlrooms/duckdb";
import { useMemo } from "react";
import { SpinnerPane } from "@sqlrooms/ui";
import useDataPreparation from "@/components/useDataPreparation";
import Notebook from "@/components/notebook/Notebook";
import useDataProcessing from "./useDataProcessing";
import DeckGLMap from "@/components/deckgl/DeckGLMap";

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
    countriesStats
  } = useDataProcessing();

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

      <Notebook
        migAndRemAvgYear={migAndRemAvgYear}
        disasters={disasters}
        disastersImpactsByMonth={disastersImpactsByMonth}
        migAndRemByIncome={migAndRemByIncome}
        migAndRemByRegion={migAndRemByRegion}
        migAndRemByDestination={migAndRemByDestination}
        migAndRemByOrigin={migAndRemByOrigin}
        flowsPerYear={flowsPerYear}
        countriesStats={countriesStats}
      />
    </>
  );
};

export default MainView;
