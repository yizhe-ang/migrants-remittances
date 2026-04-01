import { useRoomStore } from "@/store";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import cameraPositions from "@/components/data/cameraPositions";
import { sankeyLinkHorizontal } from "@visx/sankey";
import DrawSVGPlugin from "gsap/DrawSVGPlugin";

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(DrawSVGPlugin);

const linkHorizontal = sankeyLinkHorizontal();

const ScrollyTelling = () => {
  const flowsMap2019 = useRoomStore((s) => s.flowsMap2019);
  const cameraControls = useRoomStore((s) => s.cameraControls);
  const arcs = useRoomStore((s) => s.arcs);
  const points = useRoomStore((s) => s.points);
  const sankeyIncome = useRoomStore((s) => s.sankeyIncome);

  const setShowCountryPoints = useRoomStore((s) => s.setShowCountryPoints);
  const setEnableMapInteractions = useRoomStore(
    (s) => s.setEnableMapInteractions,
  );
  const setEnableControls = useRoomStore((s) => s.setEnableControls);
  const setColorPointsBy = useRoomStore((s) => s.setColorPointsBy);
  const setPointsValue = useRoomStore((s) => s.setPointsValue);

  useGSAP(() => {
    if (!cameraControls || !arcs || !points || !flowsMap2019) return;

    const fromUsaFlows = flowsMap2019.get("destination").get("USA");

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

    const sendingPoints = [
      ...points.countryTypeToIdx.get("destination").values(),
    ].map((idx) => ({
      sizeT: 0,
      idx,
    }));

    const receivingPoints = [
      ...points.countryTypeToIdx.get("origin").values(),
    ].map((idx) => ({
      sizeT: 0,
      idx,
    }));

    gsap.set(
      "#sankey-income-lower-middle .node-text-High-income-, #sankey-income-lower-middle .node-text-Upper-middle-income-, #sankey-income-lower-middle .node-text-Low-income-",
      {
        autoAlpha: 0,
      },
    );
    gsap.set(
      "#sankey-income-low .node-text-High-income-, #sankey-income-low .node-text-Upper-middle-income-, #sankey-income-low .node-text-Lower-middle-income-",
      {
        autoAlpha: 0,
      },
    );
    gsap.set(
      "#sankey-income-upper-middle .sankey-links, #sankey-income-upper-middle .sankey-nodes, #sankey-income-upper-middle .node-text-High-income-, #sankey-income-upper-middle .node-text-Lower-middle-income-, #sankey-income-upper-middle .node-text-Low-income-",
      {
        autoAlpha: 0,
      },
    );
    gsap.set(
      "#sankey-income-all-alt .sankey-links, #sankey-income-all-alt .sankey-nodes",
      {
        autoAlpha: 0,
      },
    );

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
        onUpdate: () => {
          // Single sync per frame — replaces ~100 individual onUpdate calls
          fromUsaFlowsIndices.forEach((idx, i) => {
            arcProgressArr[idx] = usaArcs[i].progress;
          });
          arcs.buffers.progress.needsUpdate = true;
          cameraControls.setLookAt(...cameraLookAt, false);
        },
      })
      .to(usaArcs, { progress: 0.5, duration: 0.7, stagger: 0.01 }, 0)
      .to(usaArcs, { progress: 0, duration: 0.3, stagger: 0.007 }, 0.7)
      .to(cameraLookAt, { endArray: cameraPositions.usaMid, duration: 0.4 }, 0)
      .to(
        cameraLookAt,
        { endArray: cameraPositions.usaEnd, duration: 0.5 },
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
      .to(
        arcs.u.windStreaksT,
        {
          value: 1,
          duration: 0.1,
        },
        0,
      )
      .to(
        arcs.u.windGradientT,
        {
          value: 1,
          duration: 0.1,
        },
        0,
      )
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
      );
    // .to(
    //   arcs.u.opacity,
    //   {
    //     value: 1,
    //     duration: 0.5,
    //   },
    //   0.3,
    // );

    // gsap
    //   .timeline({
    //     scrollTrigger: {
    //       trigger: "#step-5",
    //       start: "top bottom",
    //       end: "bottom bottom",
    //       scrub: true,
    //     },
    //     duration: 1,
    //   })

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
      // Zoom out to default view
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
      // Show sending countries first
      .to(
        sendingPoints,
        {
          sizeT: 1,
          duration: 0.3,
          stagger: 0.001,
          onUpdate: () => {
            sendingPoints.forEach(({ sizeT, idx }) => {
              points.buffers.size.buffer.array[idx] =
                sizeT * points.buffers.size.og[idx];
            });
            points.buffers.size.buffer.needsUpdate = true;
          },
        },
        0.1,
      )
      .to(
        arcs.u.staggeredT,
        {
          value: 1,
          duration: 0.6,
        },
        0.4,
      )
      .to(
        sendingPoints,
        {
          sizeT: 0,
          duration: 0.1,
          onUpdate: () => {
            sendingPoints.forEach(({ sizeT, idx }) => {
              points.buffers.size.buffer.array[idx] =
                sizeT * points.buffers.size.og[idx];
            });
            points.buffers.size.buffer.needsUpdate = true;
          },
        },
        0.6,
      )
      .to(
        receivingPoints,
        {
          sizeT: 1,
          duration: 0.3,
          stagger: 0.001,
          onUpdate: () => {
            receivingPoints.forEach(({ sizeT, idx }) => {
              points.buffers.size.buffer.array[idx] =
                sizeT * points.buffers.size.og[idx];
            });
            points.buffers.size.buffer.needsUpdate = true;
          },
        },
        0.7,
      );

    gsap
      .timeline({
        scrollTrigger: {
          trigger: "#step-dashboard-1",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
          onEnter: () => {
            setEnableMapInteractions(true);
          },
          onLeaveBack: () => {
            setEnableMapInteractions(false);
          },
        },
        duration: 1,
      })
      .to(
        "#show-controls",
        {
          autoAlpha: 1,
          duration: 0.3,
        },
        0,
      );

    // Show income scales etc.
    gsap
      .timeline({
        scrollTrigger: {
          trigger: "#step-7-1",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
          onEnter: () => {
            setColorPointsBy(["income"]);
            setShowCountryPoints(["sending"]);
            setEnableControls(false);
          },
          onLeaveBack: () => {
            setColorPointsBy(["value"]);
            setShowCountryPoints(["receiving"]);
            setEnableControls(true);
          },
        },
        duration: 1,
      })
      .to(
        "#color-controls",
        {
          autoAlpha: 1,
          duration: 0.3,
        },
        0,
      );

    // Transition to sankey
    gsap
      .timeline({
        scrollTrigger: {
          trigger: "#step-7",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
          onEnter: () => {
            // document.querySelector("canvas").style.pointerEvents = "none";
            setEnableMapInteractions(false);
          },
          onLeaveBack: () => {
            // document.querySelector("canvas").style.pointerEvents = "auto";
            setEnableMapInteractions(true);
          },
        },
        duration: 1,
      })
      .to(
        "#sankey-income-all",
        {
          autoAlpha: 1,
          duration: 0.1,
        },
        0,
      )
      .from(
        "#sankey-income-all .sankey-node-sending",
        {
          autoAlpha: 0,
          duration: 0.2,
        },
        0.1,
      )
      .from(
        "#sankey-income-all .sankey-links path",
        {
          drawSVG: 0,
          duration: 0.4,
          // stagger: 0.005,
        },
        0.3,
      )
      .from(
        "#sankey-income-all .sankey-node-receiving",
        {
          autoAlpha: 0,
          duration: 0.2,
        },
        0.7,
      )
      .from(
        "#sankey-income-all .sankey-data-texts",
        {
          autoAlpha: 0,
          duration: 0.2,
        },
        0.8,
      )
      .to(
        points.u.opacity,
        {
          value: 0,
          duration: 0.3,
        },
        0,
      )
      .to(
        "canvas",
        {
          opacity: 0.2,
          duration: 0.3,
        },
        0,
      )
      .to(
        "#show-controls",
        {
          autoAlpha: 0,
          duration: 0.3,
        },
        0,
      )
      .to(
        "#color-controls",
        {
          autoAlpha: 0,
          duration: 0.3,
        },
        0,
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
        "#sankey-income-all .sankey-data-texts",
        {
          autoAlpha: 0,
          duration: 0.2,
        },
        0,
      )
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
        "#sankey-income-upper-middle",
        {
          autoAlpha: 1,
          duration: 0.2,
        },
        0.2,
      )
      .to(
        "#sankey-income",
        {
          x: `-=${(sankeyIncome.width + 40) * 2}`,
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
        "#sankey-income-low .sankey-data-texts",
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
      )
      .to(
        "#sankey-income-all-alt",
        {
          autoAlpha: 1,
          duration: 0.2,
        },
        0.4,
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
            setPointsValue(["propGdp"]);
            setEnableMapInteractions(true);
            setEnableControls(true);
          },
          onLeaveBack: () => {
            setShowCountryPoints(["sending"]);
            setPointsValue(["absolute"]);
            setEnableMapInteractions(false);
            setEnableControls(false);
          },
        },
        duration: 1,
      })
      // .to(
      //   pointsAnim,
      //   {
      //     sizePropGdpT: 1,
      //     duration: 0.1,
      //     onUpdate: () => {
      //       for (let i = 0; i < points.buffers.size.buffer.array.length; i++) {
      //         points.buffers.size.buffer.array[i] =
      //           pointsAnim.sizePropGdpT * points.buffers.size.propGdp[i];
      //       }
      //       points.buffers.size.buffer.needsUpdate = true;
      //     },
      //   },
      //   0,
      // )
      .to(
        "#sankey-income-all-alt",
        {
          autoAlpha: 0,
          duration: 0.3,
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
      )
      .to(
        "canvas",
        {
          opacity: 1,
          duration: 0.3,
        },
        0,
      )
      .to(
        "#show-controls",
        {
          autoAlpha: 1,
          duration: 0.3,
        },
        0,
      )
      .to(
        "#color-controls",
        {
          autoAlpha: 1,
          duration: 0.3,
        },
        0,
      )
      .to(
        "#size-controls",
        {
          autoAlpha: 1,
          duration: 0.3,
        },
        0,
      )
      .to(
        points.u.opacity,
        {
          value: 1,
          duration: 0.3,
        },
        0,
      );

    gsap
      .timeline({
        scrollTrigger: {
          trigger: "#step-13",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
          onEnter: () => {
            setEnableMapInteractions(false);
          },
          onLeaveBack: () => {
            setEnableMapInteractions(true);
          },
        },
        duration: 1,
      })
      .to(
        "canvas",
        {
          opacity: 0.2,
          duration: 0.3,
        },
        0,
      )
      .to(
        "#show-controls",
        {
          autoAlpha: 0,
          duration: 0.3,
        },
        0,
      )
      .to(
        "#color-controls",
        {
          autoAlpha: 0,
          duration: 0.3,
        },
        0,
      )
      .to(
        "#size-controls",
        {
          autoAlpha: 0,
          duration: 0.3,
        },
        0,
      )
      .to(
        points.u.opacity,
        {
          value: 0,
          duration: 0.3,
        },
        0,
      )
      .to(
        "#beeswarm-disasters",
        {
          autoAlpha: 1,
          duration: 0.3,
        },
        0,
      );

    gsap
      .timeline({
        scrollTrigger: {
          trigger: "#step-14",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
        duration: 1,
      })
      .to(
        "#beeswarm-disasters-title",
        {
          autoAlpha: 0,
          duration: 0.1,
        },
        0,
      )
      .from(
        "#area-disasters-title",
        {
          autoAlpha: 0,
          duration: 0.1,
        },
        0,
      )
      .to(
        "#beeswarm-disasters",
        {
          autoAlpha: 0.5,
          duration: 0.3,
        },
        0,
      )
      .to(
        "#area-disasters",
        {
          autoAlpha: 1,
          duration: 0.3,
        },
        0,
      );

    gsap
      .timeline({
        scrollTrigger: {
          trigger: "#step-15",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
        duration: 1,
      })
      .to(
        "#beeswarm-disasters",
        {
          autoAlpha: 0,
          duration: 0.3,
        },
        0,
      )
      .to(
        "#area-disasters",
        {
          autoAlpha: 0,
          duration: 0.3,
        },
        0,
      )
      .to(
        "#rect-disasters",
        {
          autoAlpha: 1,
          duration: 0.3,
        },
        0,
      );

    gsap
      .timeline({
        scrollTrigger: {
          trigger: "#step-16",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
          onEnter: () => {
            setEnableMapInteractions(true);
          },
          onLeaveBack: () => {
            setEnableMapInteractions(false);
          },
        },
        duration: 1,
      })
      .to(
        "#rect-disasters",
        {
          autoAlpha: 0,
          duration: 0.3,
        },
        0,
      )
      .to(
        "canvas",
        {
          opacity: 1,
          duration: 0.3,
        },
        0,
      )
      .to(
        "#show-controls",
        {
          autoAlpha: 1,
          duration: 0.3,
        },
        0,
      )
      .to(
        "#color-controls",
        {
          autoAlpha: 1,
          duration: 0.3,
        },
        0,
      )
      .to(
        "#size-controls",
        {
          autoAlpha: 1,
          duration: 0.3,
        },
        0,
      )
      .to(
        points.u.opacity,
        {
          value: 1,
          duration: 0.3,
        },
        0,
      );
  }, [cameraControls, arcs, points, flowsMap2019]);

  return <></>;
};

export default ScrollyTelling;
