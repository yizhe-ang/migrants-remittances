import { useRoomStore } from "@/store";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@sqlrooms/ui";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import cameraPositions from "@/components/data/cameraPositions";

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(ScrollTrigger);

const ScrollyTelling = () => {
  const flowsMap = useRoomStore((s) => s.flowsMap);
  const cameraControls = useRoomStore((s) => s.cameraControls);
  const arcs = useRoomStore((s) => s.arcs);
  const points = useRoomStore((s) => s.points);

  useGSAP(() => {
    if (!cameraControls || !arcs || !points) return;

    const cameraLookAt = [...cameraPositions.init];

    const fromUsaFlows = flowsMap.get("destination").get("USA");
    const fromUsaFlowsIndices = fromUsaFlows.map((d) => d.idx);

    gsap
      .timeline({
        scrollTrigger: {
          trigger: "#step-1",
          start: "top center",
          end: "bottom bottom",
          scrub: true,
        },
      })
      .to(cameraLookAt, {
        endArray: cameraPositions.usaStart,
        onUpdate: () => {
          cameraControls.setLookAt(...cameraLookAt, false);
        },
      });

    gsap
      .timeline({
        scrollTrigger: {
          trigger: "#step-2",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
          onEnter: () => {
            arcs.u.progressT = 0;

            fromUsaFlowsIndices.forEach((idx) => {
              arcs.buffers.progress.from.value.array[idx] = 1;
              arcs.buffers.progress.to.value.array[idx] = 0.5;
            });

            arcs.buffers.progress.from.value.needsUpdate = true;
            arcs.buffers.progress.to.value.needsUpdate = true;
          },
        },
      })
      .to(arcs.u.progressT, {
        value: 1,
      })
      .to(
        cameraLookAt,
        {
          endArray: cameraPositions.usaEnd,
          onUpdate: () => {
            cameraControls.setLookAt(...cameraLookAt, false);
          },
        },
        "<",
      );
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
