import { RoomShell } from "@sqlrooms/room-shell";
import { roomStore } from "@/store";
import { Leva } from "leva";
import MainView from "@/components/MainView";
import { ReactLenis } from "lenis/react";
import gsap from "gsap";
import { useEffect, useRef } from "react";

export function App() {
  const lenisRef = useRef();

  useEffect(() => {
    function update(time) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);

    return () => gsap.ticker.remove(update);
  }, []);

  return (
    <>
      <ReactLenis root options={{ autoRaf: false }} ref={lenisRef} />

      <Leva
        theme={{
          space: { colGap: 0 },
          sizes: { rootWidth: "300px", controlWidth: "150px" },
        }}
        hidden
      />

      <RoomShell className="h-screen" roomStore={roomStore}>
        {/* <RoomShell.LoadingProgress /> */}

        <MainView />
      </RoomShell>
    </>
  );
}

export default App;
