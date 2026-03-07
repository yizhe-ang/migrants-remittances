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
  } = useDataProcessing();

  return (
    <>
      {/* {migAndRemByDestination && migAndRemByOrigin && migAndRemAvgYear && disasters && disastersByCountry && (
        <DeckGLMap
          migAndRemByDestination={migAndRemByDestination.toArray()}
          migAndRemByOrigin={migAndRemByOrigin.toArray()}
          migAndRemAvgYear={migAndRemAvgYear.toArray()}
          disasters={disasters.toArray()}
          disastersByCountry={disastersByCountry.toArray()}
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
      />
    </>
  );
};

export default MainView;
