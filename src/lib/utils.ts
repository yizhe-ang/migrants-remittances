import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { color } from "d3-color";
import { animate } from "motion";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function latToMercatorY(lat) {
  const clamped = Math.max(-85.051, Math.min(85.051, lat));
  return (
    (180 / Math.PI) *
    Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI) / 360))
  );
}

export function transitionBuffer(fromBuffer, toBuffer, playhead, targetValues, opts?) {
  const fromArr = fromBuffer.value.array;
  const toArr = toBuffer.value.array;
  const currentT = playhead.value;

  for (let i = 0; i < fromArr.length; i++) {
    fromArr[i] = fromArr[i] + (toArr[i] - fromArr[i]) * currentT;
  }

  for (let i = 0; i < toArr.length; i++) {
    toArr[i] = targetValues[i] ?? 0;
  }

  fromBuffer.value.needsUpdate = true;
  toBuffer.value.needsUpdate = true;
  playhead.value = 0;

  return animate(0, 1, {
    duration: opts?.duration ?? 0.5,
    ease: opts?.ease ?? "easeOut",
    onUpdate: (v) => {
      playhead.value = v;
    },
  });
}
