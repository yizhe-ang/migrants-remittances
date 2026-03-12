import { CameraControls as CameraControlsDrei } from "@react-three/drei";
import { useControls, button, folder } from "leva";
import { forwardRef } from "react";
import { CameraControlsImpl } from "@react-three/drei";

const { ACTION } = CameraControlsImpl;

const CameraControls = forwardRef(({ ...props }, ref) => {
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

  // Init camera position
  // useEffect(() => {
  //   ref.current.setLookAt(...cameraPositions.islandFront, false);
  //   // ref.current.setLookAt(...cameraPositions.takeoffStart, false);

  //   ref.autoRotate = false;
  // }, []);

  // useFrame((_, delta) => {
  //   // Auto-rotate
  //   if (ref.autoRotate) {
  //     ref.current.azimuthAngle += 0.5 * delta * THREE.MathUtils.DEG2RAD;

  //     // Normalize
  //     ref.current.azimuthAngle = ref.current.azimuthAngle % (2 * Math.PI);
  //   }
  // });

  return (
    <CameraControlsDrei
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
});

export default CameraControls;
