import { useRoomStore } from "@/store";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(useGSAP);

const ScrollyTelling = () => {
  const cameraControls = useRoomStore((s) => s.cameraControls);

  useGSAP(() => {
    if (!cameraControls) return;
  }, [cameraControls]);

  return <div></div>;
};

export default ScrollyTelling;
