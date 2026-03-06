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

  // TODO: .toArray() the data needed
  const {
    migAndRemAvgYear,
    disasters,
    disastersImpactsByMonth,
    migAndRemByIncome,
    migAndRemByRegion,
    migAndRemByDestination,
    migAndRemByOrigin,
  } = useDataProcessing();

  return (
    <>
      <DeckGLMap
        migAndRemByDestination={migAndRemByDestination?.toArray()}
        migAndRemAvgYear={migAndRemAvgYear?.toArray()}
      />

      {/* <Notebook
        migAndRemAvgYear={migAndRemAvgYear}
        disasters={disasters}
        disastersImpactsByMonth={disastersImpactsByMonth}
        migAndRemByIncome={migAndRemByIncome}
        migAndRemByRegion={migAndRemByRegion}
        migAndRemByDestination={migAndRemByDestination}
        migAndRemByOrigin={migAndRemByOrigin}
      /> */}
    </>
  );
};

export default MainView;
