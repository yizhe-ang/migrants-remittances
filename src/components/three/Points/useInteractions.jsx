import { useRoomStore } from "@/store";
import { animate } from "motion";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three/webgpu";

const colorDummy = new THREE.Color();

export default function useInteractions({ u, buffers, countryTypeToIdx }) {
  const enableMapInteractions = useRoomStore(
    (state) => state.enableMapInteractions,
  );

  const hoveredCountry = useRoomStore((state) => state.hoveredCountry);
  const showCountryPoints = useRoomStore((state) => state.showCountryPoints);
  const pointsValue = useRoomStore((state) => state.pointsValue);
  const colorPointsBy = useRoomStore((state) => state.colorPointsBy);

  const flowsMap = useRoomStore((state) => state.flowsMap);
  const remRadiusScale = useRoomStore((state) => state.remRadiusScale);
  const propGdpRadiusScale = useRoomStore((state) => state.propGdpRadiusScale);
  const remToColorScale = useRoomStore((state) => state.remToColorScale);
  const remFromColorScale = useRoomStore((state) => state.remFromColorScale);
  const propGdpFromColorScale = useRoomStore(
    (state) => state.propGdpFromColorScale,
  );
  const propGdpToColorScale = useRoomStore(
    (state) => state.propGdpToColorScale,
  );
  const incomeColorScale = useRoomStore((state) => state.incomeColorScale);

  const animRef = useRef(null);

  // Get target sizes and colors ###############################################
  const { sizeTargets, colorTargets, sizeScale, colorScale } = useMemo(() => {
    if (!buffers) return {};

    let sizeTargets;
    let colorTargets;
    let sizeScale;
    let colorScale;

    if (pointsValue[0] === "absolute") {
      sizeTargets = buffers.size.og;
      colorTargets = buffers.color.og;

      sizeScale = (d) => remRadiusScale(d.flow.sim_remittances_with);

      colorScale = (d, flowType) => {
        if (flowType === "origin") {
          return remToColorScale(d.flow.sim_remittances_with);
        }
        if (flowType === "destination") {
          return remFromColorScale(d.flow.sim_remittances_with);
        }
      };
    }

    if (pointsValue[0] === "propGdp") {
      sizeTargets = buffers.size.propGdp;
      // colorTargets = buffers.color.propGdp;
      colorTargets = buffers.color.og;

      // FIXME: d.flow.prop_of_gdp does not exist
      sizeScale = (d) => propGdpRadiusScale(d.flow.prop_of_gdp);

      colorScale = (d, flowType) => {
        if (flowType === "origin") {
          return propGdpToColorScale(d.flow.prop_of_gdp);
        }
        if (flowType === "destination") {
          return propGdpFromColorScale(d.flow.prop_of_gdp);
        }
      };
    }

    return {
      sizeTargets,
      colorTargets,
      sizeScale,
      colorScale,
    };
  }, [
    pointsValue,
    buffers,
    remRadiusScale,
    propGdpRadiusScale,
    remToColorScale,
    remFromColorScale,
    propGdpToColorScale,
    propGdpFromColorScale,
    showCountryPoints,
    colorPointsBy,
  ]);

  // Color by income ###########################################################
  useEffect(() => {
    if (!u) return;

    if (colorPointsBy[0] === "income") {
      animate(u.incomeColorT, { value: 1 }, { duration: 0.2 });
    }

    if (colorPointsBy[0] === "value") {
      animate(u.incomeColorT, { value: 0 }, { duration: 0.2 });
    }
  }, [colorPointsBy, u]);

  // TODO: Just control size?
  // Select which points to hide ###############################################
  useEffect(() => {
    if (!buffers) return;

    const opacityArr = buffers.opacity.buffer.array;

    const opacitySnapshot = opacityArr.slice();
    const opacityTargets = new Float32Array(opacityArr.length);

    if (showCountryPoints.includes("receiving")) {
      for (const idx of countryTypeToIdx.get("origin").values()) {
        opacityTargets[idx] = 1;
      }
    }
    if (showCountryPoints.includes("sending")) {
      for (const idx of countryTypeToIdx.get("destination").values()) {
        opacityTargets[idx] = 1;
      }
    }

    animRef.current = animate(0, 1, {
      duration: 0.2,
      ease: "easeOut",
      onUpdate: (t) => {
        for (let i = 0; i < opacityArr.length; i++) {
          opacityArr[i] =
            opacitySnapshot[i] + (opacityTargets[i] - opacitySnapshot[i]) * t;
        }
        buffers.opacity.buffer.needsUpdate = true;
      },
    });
  }, [buffers, showCountryPoints]);

  // Animate on hovered country change
  useEffect(() => {
    if (!enableMapInteractions) return;

    if (
      !flowsMap ||
      !buffers ||
      !countryTypeToIdx ||
      !remRadiusScale ||
      !remToColorScale ||
      !remFromColorScale ||
      !sizeTargets ||
      !colorTargets ||
      !sizeScale ||
      !colorScale
    )
      return;

    const sizeArr = buffers.size.buffer.array;
    const colorArr = buffers.color.buffer.array;
    const sizeSnapshot = sizeArr.slice();
    const colorSnapshot = colorArr.slice();

    // Init copies (to be mutated)
    const sizeTargetsProcessed = hoveredCountry
      ? new Float32Array(sizeArr.length)
      : sizeTargets.slice();
    const colorTargetsProcessed = colorTargets.slice();

    // If hovered, change target values
    if (hoveredCountry) {
      // NOTE: Don't handle first
      if (pointsValue[0] === "propGdp") return;

      const { type, country } = hoveredCountry;
      const highlightFlows = flowsMap.get(type).get(country);

      highlightFlows.forEach((d) => {
        const flowType = type === "origin" ? "destination" : "origin";

        const idx = countryTypeToIdx.get(flowType).get(d.flow[flowType]);

        sizeTargetsProcessed[idx] = sizeScale(d);

        colorDummy.setStyle(colorScale(d, flowType));

        colorTargetsProcessed[idx * 4] = colorDummy.r;
        colorTargetsProcessed[idx * 4 + 1] = colorDummy.g;
        colorTargetsProcessed[idx * 4 + 2] = colorDummy.b;
      });

      // Hovered country should be the same
      const countryOriginIdx = countryTypeToIdx.get("origin").get(country);
      const countryDestIdx = countryTypeToIdx.get("destination").get(country);

      sizeTargetsProcessed[countryOriginIdx] = sizeTargets[countryOriginIdx];
      sizeTargetsProcessed[countryDestIdx] = sizeTargets[countryDestIdx];
    }

    animRef.current = animate(0, 1, {
      duration: 0.5,
      ease: "easeOut",
      onUpdate: (t) => {
        for (let i = 0; i < sizeArr.length; i++) {
          sizeArr[i] =
            sizeSnapshot[i] + (sizeTargetsProcessed[i] - sizeSnapshot[i]) * t;
        }
        for (let i = 0; i < colorArr.length; i++) {
          colorArr[i] =
            colorSnapshot[i] +
            (colorTargetsProcessed[i] - colorSnapshot[i]) * t;
        }
        buffers.size.buffer.needsUpdate = true;
        buffers.color.buffer.needsUpdate = true;
      },
    });

    return () => animRef.current?.stop();
  }, [
    hoveredCountry,
    flowsMap,
    buffers,
    countryTypeToIdx,
    remRadiusScale,
    remToColorScale,
    remFromColorScale,
    enableMapInteractions,
    sizeTargets,
    colorTargets,
    sizeScale,
    colorScale,
    pointsValue,
  ]);
}
