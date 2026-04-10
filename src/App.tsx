import { RoomShell, RoomStateProvider } from "@sqlrooms/room-shell";
import { roomStore } from "@/store";
import { Leva } from "leva";
import MainView from "@/components/MainView";
import { ReactLenis } from "lenis/react";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { useRoomStore } from "@/store";

export function App() {
  const lenisRef = useRef();
  const scrollLockRef = useRef(null);
  const dataSourcesReady = useRoomStore((state) => state.dataSourcesReady);
  const derivedDataReady = useRoomStore((state) => state.derivedDataReady);
  const sceneReady = useRoomStore((state) => state.sceneReady);
  const showLoadingScreen = useRoomStore((state) => state.showLoadingScreen);
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
    const html = document.documentElement;
    const body = document.body;

    if (showLoadingScreen) {
      if (!scrollLockRef.current) {
        scrollLockRef.current = {
          htmlOverflow: html.style.overflow,
          bodyOverflow: body.style.overflow,
          bodyTouchAction: body.style.touchAction,
          bodyOverscrollBehavior: body.style.overscrollBehavior,
        };
      }

      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      body.style.touchAction = "none";
      body.style.overscrollBehavior = "none";
    } else if (scrollLockRef.current) {
      html.style.overflow = scrollLockRef.current.htmlOverflow;
      body.style.overflow = scrollLockRef.current.bodyOverflow;
      body.style.touchAction = scrollLockRef.current.bodyTouchAction;
      body.style.overscrollBehavior =
        scrollLockRef.current.bodyOverscrollBehavior;
      scrollLockRef.current = null;
    }

    return () => {
      if (!scrollLockRef.current) return;

      html.style.overflow = scrollLockRef.current.htmlOverflow;
      body.style.overflow = scrollLockRef.current.bodyOverflow;
      body.style.touchAction = scrollLockRef.current.bodyTouchAction;
      body.style.overscrollBehavior =
        scrollLockRef.current.bodyOverscrollBehavior;
      scrollLockRef.current = null;
    };
  }, [showLoadingScreen]);

  useEffect(() => {
    let frameId = 0;

    const syncLenis = () => {
      const lenis = lenisRef.current?.lenis;

      if (!lenis) {
        frameId = window.requestAnimationFrame(syncLenis);
        return;
      }

      if (showLoadingScreen) {
        lenis.stop();
        return;
      }

      lenis.start();
      lenis.resize?.();
    };

    syncLenis();

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [showLoadingScreen]);

  useEffect(() => {
    const lenis = lenisRef.current?.lenis;

    if (!lenis || !showLoadingScreen) {
      return;
    }

    lenis.stop();
  });

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

      {/* <RoomShell className="h-screen" roomStore={roomStore} */}
      <RoomStateProvider roomStore={roomStore}>
        <MainView />
      </RoomStateProvider>
      {/* </RoomShell> */}
    </>
  );
}

export default App;
