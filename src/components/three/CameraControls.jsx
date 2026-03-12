import {
  CameraControls as CameraControlsDrei,
  CameraControlsImpl,
} from "@react-three/drei";
import { useControls, button, folder } from "leva";
import { useRef, useEffect } from "react";
import { useRoomStore } from "@/store";
import cameraPositions from "@/components/data/cameraPositions";

const { ACTION } = CameraControlsImpl;

const CameraControls = (props) => {
  const ref = useRef();
  const setCameraControls = useRoomStore((s) => s.setCameraControls);

  useEffect(() => {
    if (ref.current) setCameraControls(ref.current);
  }, [setCameraControls]);

  // Init camera position
  useEffect(() => {
    ref.current.setLookAt(...cameraPositions.init, false);
    // ref.current.setLookAt(...cameraPositions.takeoffStart, false);

    // ref.autoRotate = false;
  }, []);

  useControls({
    Camera: folder(
      {
        getLookAt: button(() => {
          const position = ref.current.getPosition();
          const target = ref.current.getTarget();
          console.log([...position, ...target]);
        }),
        toJson: button(() => console.log(ref.current.toJSON())),
      },
      {
        collapsed: true,
      },
    ),
  });

  return (
    <CameraControlsDrei
      makeDefault
      ref={ref}
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
    ></CameraControlsDrei>
  );
};

export default CameraControls;
