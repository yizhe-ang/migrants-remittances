import {
  CameraControls,
  Center,
  Environment,
  PerspectiveCamera,
} from "@react-three/drei";
import WorldMap from "@/components/three/WorldMap";
import Points from "@/components/three/Points";

const Scene = () => {
  return (
    <>
      <CameraControls />

      <PerspectiveCamera makeDefault position={[0, 0, 300]} />

      <Environment preset="city" />

      <WorldMap />

      <Points position={[0, 0, 0.5]} />
    </>
  );
};

export default Scene;
