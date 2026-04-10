import { Environment, Html, PerspectiveCamera, Text } from "@react-three/drei";
import WorldMap from "@/components/three/WorldMap";
import WorldMapOld from "@/components/three/WorldMapOld";
import Points from "@/components/three/Points/Points";
import Arcs from "@/components/three/Arcs";
import CameraControls from "@/components/three/CameraControls";
import colors from "tailwindcss/colors";
import chroma from "chroma-js";
import DisasterPoints from "./DisasterPoints";

const Scene = () => {
  return (
    <>
      <CameraControls />

      <PerspectiveCamera />

      {/* <Environment preset="city" /> */}

      <color attach="background" args={[chroma(colors.stone[50]).hex()]} />

      <ambientLight intensity={3} />

      <WorldMap position={[0, 0, -1]} />
      {/* <WorldMapOld position={[0, 0, -1]} /> */}

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
