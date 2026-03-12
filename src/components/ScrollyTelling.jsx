import { useRoomStore } from "@/store";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@sqlrooms/ui";
gsap.registerPlugin(useGSAP);

const ScrollyTelling = () => {
  const cameraControls = useRoomStore((s) => s.cameraControls);

  useGSAP(() => {
    if (!cameraControls) return;
  }, [cameraControls]);

  return (
    <div className="w-full">
      <Step className="mt-screen"></Step>

      <Step></Step>

    </div>
  );
};

const Step = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        "border border-red-300 h-[100vh] max-w-xl mx-auto",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default ScrollyTelling;
