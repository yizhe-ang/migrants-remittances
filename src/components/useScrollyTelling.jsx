import { useRoomStore } from "@/store";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(useGSAP);

export default function useScrollyTelling() {
  const cameraControls = useRoomStore((s) => s.cameraControls);

  useGSAP(() => {
    if (!cameraControls) return;
  }, [cameraControls]);
}
