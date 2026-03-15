import { useRoomStore } from "@/store";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@sqlrooms/ui";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import cameraPositions from "@/components/data/cameraPositions";
import { sankeyLinkHorizontal } from "@visx/sankey";

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(ScrollTrigger);

const linkHorizontal = sankeyLinkHorizontal();

const ScrollyTelling = () => {
  const flowsMap = useRoomStore((s) => s.flowsMap);
  const cameraControls = useRoomStore((s) => s.cameraControls);
  const arcs = useRoomStore((s) => s.arcs);
  const points = useRoomStore((s) => s.points);
  const sankeyIncome = useRoomStore((s) => s.sankeyIncome);

  useGSAP(() => {
    if (!cameraControls || !arcs || !points) return;

    const fromUsaFlows = flowsMap.get("destination").get("USA");

    const cameraLookAt = [...cameraPositions.init];
    const arcProgressArr = arcs.buffers.progress.array;

    const fromUsaFlowsIndices = fromUsaFlows.map((d) => d.idx);
    const destinationUsaPointIdx = points.countryTypeToIdx
      .get("destination")
      .get("USA");
    const fromUsaPointsIndices = fromUsaFlows.map((d) => {
      const idx = points.countryTypeToIdx.get("origin").get(d.flow.origin);
      return idx;
    });

    const usaArcs = fromUsaFlowsIndices.map(() => ({
      progress: 1,
    }));
    const usaPoint = {
      size: 0,
    };
    const fromUsaPoints = fromUsaPointsIndices.map(() => ({
      sizeT: 0,
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

    gsap
      .timeline({
        scrollTrigger: {
          trigger: "#step-3",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
      })
      // Show USA destination point
      .to(usaPoint, {
        size: points.buffers.size.og[destinationUsaPointIdx],
        duration: 0.2,
        onUpdate: () => {
          points.buffers.size.buffer.array[destinationUsaPointIdx] =
            usaPoint.size;
          points.buffers.size.buffer.needsUpdate = true;
        },
      })
      // Show usa arcs again, flying to remit
      .to(
        usaArcs,
        {
          progress: 0.5,
          duration: 0.5,
          stagger: 0.007,
          onUpdate: () => {
            fromUsaFlowsIndices.forEach((idx, i) => {
              arcProgressArr[idx] = usaArcs[i].progress;
            });
            arcs.buffers.progress.needsUpdate = true;
          },
        },
        0.2,
      )
      // Zoom out to show world map
      .to(
        cameraLookAt,
        {
          endArray: cameraPositions.usaZoomOut,
          duration: 0.5,
          onUpdate: () => {
            cameraControls.setLookAt(...cameraLookAt, false);
          },
        },
        0.2,
      )
      // Show receiving points
      .to(
        fromUsaPoints,
        {
          sizeT: 0.5,
          duration: 0.3,
          stagger: 0.007,
          onUpdate: () => {
            fromUsaPointsIndices.forEach((idx, i) => {
              points.buffers.size.buffer.array[idx] =
                fromUsaPoints[i].sizeT * points.buffers.size.og[idx];
            });
            points.buffers.size.buffer.needsUpdate = true;
          },
        },
        0.4,
      )
      // Undraw arcs
      .to(
        usaArcs,
        {
          progress: 1,
          duration: 0.3,
          stagger: 0.007,
          onUpdate: () => {
            fromUsaFlowsIndices.forEach((idx, i) => {
              arcProgressArr[idx] = usaArcs[i].progress;
            });
            arcs.buffers.progress.needsUpdate = true;
          },
        },
        0.6,
      );
    // Fade out arcs opacity before step-4
    // .to(arcs.u.opacity, { value: 0, duration: 0.01 }, 0.99);
    // TODO: Show tooltips for all of the shown points
    // i.e. country + remittance amount for USA

    gsap
      .timeline({
        scrollTrigger: {
          trigger: "#step-4",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
      })
      // Hide all points
      .to(
        fromUsaPoints,
        {
          sizeT: 0,
          duration: 0.2,
          onUpdate: () => {
            fromUsaPointsIndices.forEach((idx, i) => {
              points.buffers.size.buffer.array[idx] =
                fromUsaPoints[i].sizeT * points.buffers.size.og[idx];
            });
            points.buffers.size.buffer.needsUpdate = true;
          },
        },
        0.2,
      )
      .to(
        usaPoint,
        {
          size: 0,
          duration: 0.2,
          onUpdate: () => {
            points.buffers.size.buffer.array[destinationUsaPointIdx] =
              usaPoint.size;
            points.buffers.size.buffer.needsUpdate = true;
          },
        },
        0.2,
      )
      .to(
        arcs.u.opacity,
        {
          value: 0,
          duration: 0.1,
        },
        0.1,
      )
      .to(
        arcs.u.movementT,
        {
          value: 1,
          duration: 0.1,
        },
        0.2,
      )
      .to(
        arcs.u.opacity,
        {
          value: 1,
          duration: 0.6,
        },
        0.4,
      );

    gsap
      .timeline({
        scrollTrigger: {
          trigger: "#step-5",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
        duration: 1,
      })
      .to(
        arcs.u.opacity,
        {
          value: 0,
          duration: 0.4,
        },
        0.4,
      )
      .to(
        arcs.u.movementT,
        {
          value: 0,
          duration: 0.1,
        },
        0.9,
      );

    gsap
      .timeline({
        scrollTrigger: {
          trigger: "#step-6",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
        duration: 1,
      })
      // Reset arcs
      .to(
        usaArcs,
        {
          progress: 0,
          duration: 0.05,
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
        arcs.u.opacity,
        {
          value: 1,
          duration: 0.05,
        },
        0.05,
      )
      .to(
        cameraLookAt,
        {
          endArray: cameraPositions.zoomOutFlat,
          duration: 0.5,
          onUpdate: () => {
            cameraControls.setLookAt(...cameraLookAt, false);
          },
        },
        0,
      )
      .to(
        points.u.staggeredT,
        {
          value: 1,
          duration: 0.9,
        },
        0.1,
      )
      .to(
        arcs.u.staggeredT,
        {
          value: 1,
          duration: 0.9,
        },
        0.3,
      );

    // Transition to sankey
    gsap
      .timeline({
        scrollTrigger: {
          trigger: "#step-7",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
        duration: 1,
      })
      .to(
        "#sankey-income-all",
        {
          autoAlpha: 1,
          duration: 0.5,
        },
        0.5,
      );

    // Show upper-middle income sankey
    gsap
      .timeline({
        scrollTrigger: {
          trigger: "#step-9",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
        duration: 1,
      })
      .to(
        "#sankey-income-all .sankey-links path",
        {
          attr: {
            d: (i) => {
              const path = linkHorizontal(
                sankeyIncome.graphs.upperMiddle.links[i],
              );
              return path;
            },
            "stroke-width": (i) => {
              return sankeyIncome.graphs.upperMiddle.links[i].width;
            },
          },
          duration: 0.3,
        },
        0,
      )
      .to(
        "#sankey-income-all .sankey-nodes rect",
        {
          attr: {
            width: (i) => {
              const { x1, x0 } = sankeyIncome.graphs.upperMiddle.nodes[i];
              return x1 - x0;
            },
            height: (i) => {
              const { y1, y0 } = sankeyIncome.graphs.upperMiddle.nodes[i];
              return y1 - y0;
            },
            x: (i) => {
              const { x0 } = sankeyIncome.graphs.upperMiddle.nodes[i];
              return x0;
            },
            y: (i) => {
              const { y0 } = sankeyIncome.graphs.upperMiddle.nodes[i];
              return y0;
            },
          },
          duration: 0.4,
        },
        0,
      )
      .to(
        "#sankey-income",
        {
          x: `-=${(sankeyIncome.width + 10) * 2}`,
          duration: 0.6,
        },
        0.4,
      )
      .to(
        "#sankey-income-lower-middle, #sankey-income-low",
        {
          autoAlpha: 1,
          duration: 0.2,
        },
        0.35,
      );
  }, [cameraControls, arcs, points]);

  return (
    <div className="w-full z-10">
      <div className="h-screen" />

      <Step id="step-1">
        <P>
          As of 2024, an estimated 304 million, or 1 in 27 people around the
          world are international migrants[1].
        </P>
      </Step>

      <Step id="step-2" className="h-[150vh]">
        <P>
          Some of them are driven by better economic opportunities abroad;
          traveling across the world to settle down in another country.
        </P>
      </Step>

      <Step id="step-3">
        <P>
          Billions of dollars flow back across borders, as these migrants also
          regularly send back money to support their families and communities.
        </P>
      </Step>

      <Step id="step-4">
        <P>
          These remittances - estimated in 2023 to total about $857 billion,
          equivalent to the GDP of Belgium[2] – now dwarf official development
          aid and represent a lifeline for many economies.
        </P>
      </Step>

      <Step id="step-5">
        <P>
          But where do these transfers actually end up in? Do they flow to
          countries in need, such as low-income and middle-income countries?
        </P>
        <P>
          Despite the importance of remittances, there is a lack of a
          comprehensive dataset of bilateral remittance flows at a high temporal
          resolution.
        </P>
      </Step>

      <Step id="step-6">
        <P>
          To answer these questions and more, researchers from CSH built a novel
          model to better understand the dynamics and structure of remittance
          flows, simulating and providing new estimates of remittance flows
          between countries from 2010 to 2019 at a monthly level.
        </P>
      </Step>

      <Step id="step-7">
        <P>
          If we were to group countries by their income level, we can see that
          high-income countries dominate the sending of money.
        </P>
      </Step>

      <Step id="step-8">
        <P>
          These high-income countries send $680 billion but only receive $195
          billion. In other words, people in these countries provide 87% of the
          funds while receiving just 25%. Economic resources from high-income
          countries are being redistributed abroad.
        </P>
      </Step>

      <Step id="step-9" className="h-[300vh]">
        <P>
          Looking at the other income groups individually, we can also see that
          the flows tend to be clustered among the same income-group countries,
          especially for remittance senders living in lower-middle- and
          low-income countries.
        </P>
      </Step>

      <Step id="step-10" className="">
        <P>
          At first glance, The main beneficiaries are middle-income countries.
          Upper-middle-income countries send 7% but receive 30%, and
          lower-middle-income countries send only 4% but receive 44%.
        </P>
        <P>
          This also means that very little money reaches the poorest countries,
          where people need it the most. Low-income countries receive just 1.7%
          of all money sent or brought back by migrants, despite being home to
          9% of the global population.
        </P>
      </Step>
    </div>
  );
};

const Step = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        "border border-red-300 border-0 h-[100vh] max-w-xl mx-auto",
        className,
      )}
      {...props}
    >
      <div className="px-4 py-4 bg-white rounded shadow-xl flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
};

const P = ({ className, ...props }) => {
  return <p className={cn("", className)} {...props} />;
};

export default ScrollyTelling;
