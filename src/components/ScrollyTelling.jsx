import { useRoomStore } from "@/store";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@sqlrooms/ui";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(ScrollTrigger);

const ScrollyTelling = () => {
  const cameraControls = useRoomStore((s) => s.cameraControls);
  const arcs = useRoomStore((s) => s.arcs);
  const points = useRoomStore((s) => s.points);
  const flowsMap = useRoomStore((s) => s.flowsMap);

  useGSAP(() => {
    if (!cameraControls || !arcs || !points) return;

    const toUsFlowsTargets = arcs.getProgressTargetsFromTypeCountry({
      country: "USA",
      type: "origin",
    });

    gsap.timeline({
      scrollTrigger: {
        trigger: "#step-1",
        start: "top bottom",
        end: "bottom bottom",
        onEnter: () => {
          arcs.u.progressT = 0

        }
      },
    })
      .to(arcs.u.progressT, {
        value: 1
      })
    // show arcs towards US

  }, [cameraControls, arcs, points]);

  return (
    <div className="w-full">
      <div className="h-screen" />

      <Step id="step-1">
        As of 2024, an estimated 304 million, or 1 in 27 people around the world
        are international migrants[1].
      </Step>

      <Step id="step-2">
        Some of them are driven by better economic opportunities abroad;
        traveling across the world to settle down in another country.
      </Step>
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
      <div className="px-4 py-4 bg-white rounded shadow-xl">{children}</div>
    </div>
  );
};

export default ScrollyTelling;
