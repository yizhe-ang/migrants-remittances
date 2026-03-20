import { Environment, PerspectiveCamera } from "@react-three/drei";
import WorldMap from "@/components/three/WorldMap";
import Points from "@/components/three/Points/Points";
import Arcs from "@/components/three/Arcs";
import CameraControls from "@/components/three/CameraControls";
import colors from "tailwindcss/colors";
import chroma from "chroma-js";

const Scene = () => {
  return (
    <>
      <CameraControls />

      <PerspectiveCamera />

      {/* <Environment preset="city" /> */}

      <color attach="background" args={[chroma(colors.stone[50]).hex()]} />

      <ambientLight intensity={2} />

      <WorldMap position={[0, 0, -1]} />

      <Points position={[0, 0, 0]} />

      <Arcs position={[0, 0, 0]} />
    </>
  );
};

export default Scene;
