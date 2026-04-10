import { PerspectiveCamera } from "@react-three/drei";
import WorldMap from "@/components/three/WorldMap";
import Points from "@/components/three/Points/Points";
import Arcs from "@/components/three/Arcs";
import CameraControls from "@/components/three/CameraControls";
import colors from "tailwindcss/colors";
import chroma from "chroma-js";
import DisasterPoints from "./DisasterPoints";
import { useEffect } from "react";
import { useRoomStore } from "@/store";

const Scene = () => {
  const setSceneReady = useRoomStore((state) => state.setSceneReady);

  useEffect(() => {
    let frameOne = 0;
    let frameTwo = 0;

    frameOne = window.requestAnimationFrame(() => {
      frameTwo = window.requestAnimationFrame(() => {
        setSceneReady(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(frameOne);
      window.cancelAnimationFrame(frameTwo);
    };
  }, [setSceneReady]);

  return (
    <>
      <CameraControls />

      <PerspectiveCamera />

      {/* <Environment preset="city" /> */}

      <color attach="background" args={[chroma(colors.stone[50]).hex()]} />

      <ambientLight intensity={3} />

      <WorldMap position={[0, 0, -1]} />

      <Points position={[0, 0, 0]} />

      <DisasterPoints position={[0, 0, 0]} />

      <Arcs position={[0, 0, 15]} />

      {/* <Html className="font-bold w-[500px]">
        Migrants,
        <br />
        Remittances and
        <br />
        Disasters
      </Html> */}
    </>
  );
};

export default Scene;
