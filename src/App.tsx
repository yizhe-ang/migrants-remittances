import { RoomShell } from "@sqlrooms/room-shell";
import { roomStore } from "@/store";
import { Leva } from "leva";
import MainView from "@/components/MainView";
import { ReactLenis } from "lenis/react";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { useRoomStore } from "@/store";

export function App() {
  const lenisRef = useRef();
  const dataSourcesReady = useRoomStore((state) => state.dataSourcesReady);
  const derivedDataReady = useRoomStore((state) => state.derivedDataReady);
  const sceneReady = useRoomStore((state) => state.sceneReady);
  const showLoadingScreen = useRoomStore((state) => state.showLoadingScreen);
  const bootStage = useRoomStore((state) => state.bootStage);
  const setBootStage = useRoomStore((state) => state.setBootStage);
  const setIsAppReady = useRoomStore((state) => state.setIsAppReady);
  const setShowLoadingScreen = useRoomStore(
    (state) => state.setShowLoadingScreen,
  );

  const isAppReady = dataSourcesReady && derivedDataReady && sceneReady;

  useEffect(() => {
    function update(time) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);

    return () => gsap.ticker.remove(update);
  }, []);

  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    if (showLoadingScreen) {
      lenis?.stop();
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
    } else {
      lenis?.start();
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    }

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [showLoadingScreen]);

  useEffect(() => {
    if (!dataSourcesReady) {
      setBootStage("Loading data");
      return;
    }

    if (!derivedDataReady) {
      setBootStage("Preparing views");
      return;
    }

    if (!sceneReady) {
      setBootStage("Starting scene");
      return;
    }

    setBootStage("Ready");
  }, [dataSourcesReady, derivedDataReady, sceneReady, setBootStage]);

  useEffect(() => {
    setIsAppReady(isAppReady);
  }, [isAppReady, setIsAppReady]);

  useEffect(() => {
    if (!isAppReady) return;

    const timeout = window.setTimeout(() => {
      setShowLoadingScreen(false);
    }, 420);

    return () => window.clearTimeout(timeout);
  }, [isAppReady, setShowLoadingScreen]);

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
