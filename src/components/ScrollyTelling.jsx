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

    const fromUsaFlows = flowsMap.get("destination").get("USA");
    const fromUsaFlowsIndices = fromUsaFlows.map((d) => d.idx);

    const cameraLookAt = [...cameraPositions.init];

    const arcProgressArr = arcs.buffers.progress.array;

    const usaArcs = fromUsaFlowsIndices.map(() => ({
      progress: 1,
    }));

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
        },
      })
      .to(
        usaArcs,
        {
          progress: 0.5,
          duration: 0.7,
          stagger: 0.01,
          onUpdate: () => {
            fromUsaFlowsIndices.forEach((idx, i) => {
              arcProgressArr[idx] = usaArcs[i].progress;
            });
            arcs.buffers.progress.needsUpdate = true;
          },
        },
        0,
      )
      .to(
        usaArcs,
        {
          progress: 0,
          duration: 0.3,
          stagger: 0.007,
          onUpdate: () => {
            fromUsaFlowsIndices.forEach((idx, i) => {
              arcProgressArr[idx] = usaArcs[i].progress;
            });
            arcs.buffers.progress.needsUpdate = true;
          },
        },
        0.7,
      )
      .to(
        cameraLookAt,
        {
          endArray: cameraPositions.usaMid,
          duration: 0.4,
          onUpdate: () => {
            cameraControls.setLookAt(...cameraLookAt, false);
          },
        },
        0,
      )
      .to(
        cameraLookAt,
        {
          endArray: cameraPositions.usaEnd,
          duration: 0.5,
          onUpdate: () => {
            cameraControls.setLookAt(...cameraLookAt, false);
          },
        },
        0.5,
      );

    // gsap
    //   .timeline({
    //     scrollTrigger: {
    //       trigger: "#step-2",
    //       start: "66% bottom",
    //       end: "bottom bottom",
    //       markers: true,
    //       scrub: true,
    //     },
    //   })

    // Show USA orange
    gsap.timeline({
      scrollTrigger: {
        trigger: "#step-3",
        start: "top bottom",
        end: "30% bottom",
        scrub: true,
      },
    });
  }, [cameraControls, arcs, points]);

  return (
    <div className="w-full">
      <div className="h-screen" />

      <Step id="step-1">
        As of 2024, an estimated 304 million, or 1 in 27 people around the world
        are international migrants[1].
      </Step>

      <Step id="step-2" className="h-[150vh]">
        Some of them are driven by better economic opportunities abroad;
        traveling across the world to settle down in another country.
      </Step>

      <Step id="step-3">
        Billions of dollars flow back across borders, as these migrants also
        regularly send back money to support their families and communities.
      </Step>

      <Step id="step-4">
        These remittances - estimated in 2023 to total about $857 billion,
        equivalent to the GDP of Belgium[2] – now dwarf official development aid
        and represent a lifeline for many economies.
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
