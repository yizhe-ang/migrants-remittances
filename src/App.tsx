import { RoomShell } from "@sqlrooms/room-shell";
import { roomStore } from "@/store";
import { Leva } from "leva";
import MainView from "@/components/MainView";

export function App() {

  return (
    <>
      <Leva
        theme={{
          space: { colGap: 0 },
          sizes: { rootWidth: "300px", controlWidth: "150px" },
        }}
      />

      <RoomShell className="h-screen" roomStore={roomStore}>
        {/* <RoomShell.LoadingProgress /> */}

        <MainView />
      </RoomShell>
    </>
  );
}

export default App;
