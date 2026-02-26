import { useRoomStore } from "@/store";
import { useSql } from "@sqlrooms/duckdb";
import { useMemo } from "react";
import { SpinnerPane } from "@sqlrooms/ui";
import useDataPreparation from "@/components/useDataPreparation";
import Notebook from "@/components/notebook/Notebook";
// import MapView from "@/components/deckgl/MapView";

const MainView = () => {
  useDataPreparation();

  return (
    <>
      <Notebook />
    </>
  );
};

export default MainView;
