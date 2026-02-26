import { useRoomStore } from "@/store";
import { useSql } from "@sqlrooms/duckdb";
import { useMemo } from "react";
import { SpinnerPane } from "@sqlrooms/ui";
import useDataPreparation from "@/components/useDataPreparation";
import Notebook from "@/components/Notebook";
// import MapView from "@/components/deckgl/MapView";

const MainView = () => {
  useDataPreparation();

  return (
    <div className="flex h-full w-full overflow-y-scroll">
      <Notebook />
    </div>
  );
};

export default MainView;
