import { useRoomStore } from "@/store";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
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
  const setShowCountryPoints = useRoomStore((s) => s.setShowCountryPoints);

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
    const pointsAnim = {
      sizePropGdpT: 0,
    };

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
      // TODO: staggered?
      .to(
        points.u.incomeColorT,
        {
          value: 1,
          duration: 0.5,
        },
        0,
      )
      .to(
        "#sankey-income-all",
        {
          autoAlpha: 1,
          duration: 0.5,
        },
        0.5,
      )
      .to(
        points.u.staggeredT,
        {
          value: 0,
          duration: 1,
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
          duration: 0.4,
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

    gsap
      .timeline({
        scrollTrigger: {
          trigger: "#step-10",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
        duration: 1,
      })
      .to(
        "#sankey-income-lower-middle, #sankey-income-all",
        {
          autoAlpha: 0,
          duration: 0.2,
        },
        0,
      )
      .to(
        "#sankey-income-low .sankey-links path",
        {
          attr: {
            d: (i) => {
              const path = linkHorizontal(sankeyIncome.graphs.all.links[i]);
              return path;
            },
            "stroke-width": (i) => {
              return sankeyIncome.graphs.all.links[i].width;
            },
          },
          duration: 0.6,
        },
        0,
      )
      .to(
        "#sankey-income-low .sankey-nodes rect",
        {
          attr: {
            width: (i) => {
              const { x1, x0 } = sankeyIncome.graphs.all.nodes[i];
              return x1 - x0;
            },
            height: (i) => {
              const { y1, y0 } = sankeyIncome.graphs.all.nodes[i];
              return y1 - y0;
            },
            x: (i) => {
              const { x0 } = sankeyIncome.graphs.all.nodes[i];
              return x0;
            },
            y: (i) => {
              const { y0 } = sankeyIncome.graphs.all.nodes[i];
              return y0;
            },
          },
          duration: 0.6,
        },
        0,
      );

    gsap
      .timeline({
        scrollTrigger: {
          trigger: "#step-12",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
          onEnter: () => {
            setShowCountryPoints(["receiving"]);
          },
          onLeaveBack: () => {
            console.log("yo");
            setShowCountryPoints(["sending", "receiving"]);
          },
        },
        duration: 1,
      })
      .to(
        pointsAnim,
        {
          sizePropGdpT: 1,
          duration: 0.1,
          onUpdate: () => {
            for (let i = 0; i < points.buffers.size.buffer.array.length; i++) {
              points.buffers.size.buffer.array[i] =
                pointsAnim.sizePropGdpT * points.buffers.size.propGdp[i];
            }
            points.buffers.size.buffer.needsUpdate = true;
          },
        },
        0,
      )
      .to(
        "#sankey-income-low",
        {
          autoAlpha: 0,
          duration: 0.3,
        },
        0,
      );
    // .to(
    //   points.u.staggeredT,
    //   {
    //     value: 1,
    //     duration: 0.8,
    //   },
    //   0.2,
    // );
  }, [cameraControls, arcs, points]);

  return <></>;
};

export default ScrollyTelling;
