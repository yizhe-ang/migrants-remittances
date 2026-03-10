import {
  CameraControls,
  Center,
  Environment,
  PerspectiveCamera,
} from "@react-three/drei";
import WorldMap from "@/components/three/WorldMap";
import Points from "@/components/three/Points";
import { CameraControlsImpl } from "@react-three/drei";

const { ACTION } = CameraControlsImpl;

const Scene = () => {
  return (
    <>
      <CameraControls
        mouseButtons={{
          left: ACTION.TRUCK,
          middle: ACTION.DOLLY,
          right: ACTION.ROTATE,
          wheel: ACTION.DOLLY,
        }}
        touches={{
          one: ACTION.TOUCH_ROTATE,
          two: ACTION.TOUCH_DOLLY_TRUCK,
          three: ACTION.TOUCH_DOLLY_TRUCK,
        }}
      />

      <PerspectiveCamera makeDefault position={[0, 0, 300]} />

      <Environment preset="city" />

      <WorldMap position={[0, 0, 0]} />

      <Points position={[0, 0, 0]} />
    </>
  );
};

export default Scene;
