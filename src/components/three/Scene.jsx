import {
  Environment,
  PerspectiveCamera,
} from "@react-three/drei";
import WorldMap from "@/components/three/WorldMap";
import Points from "@/components/three/Points/Points";
import Arcs from "@/components/three/Arcs";
import CameraControls from "@/components/three/CameraControls";

const Scene = () => {
  return (
    <>
      <CameraControls />

      <PerspectiveCamera />

      <Environment preset="city" />

      <ambientLight intensity={2} />

      <WorldMap position={[0, 0, -1]} />

      <Points position={[0, 0, 0]} />

      <Arcs position={[0, 0, 0]} />
    </>
  );
};

export default Scene;
