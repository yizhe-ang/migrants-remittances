import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { color } from "d3-color";
import { animate } from "motion";
import { format } from "d3-format";
import * as THREE from "three/webgpu";

export const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const percentFormat = format(".3p");

export const numberFormat = (n) => n.toLocaleString("en-US");

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

/**
 * Convert screen pixel coordinates to world-space position on the z=0 plane.
 * screenX/screenY are in CSS pixels relative to the canvas top-left.
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  camera: THREE.PerspectiveCamera,
  canvasWidth: number,
  canvasHeight: number,
): THREE.Vector3 {
  // Convert to NDC [-1, 1]
  const ndcX = (screenX / canvasWidth) * 2 - 1;
  const ndcY = -(screenY / canvasHeight) * 2 + 1;

  const near = new THREE.Vector3(ndcX, ndcY, -1).unproject(camera);
  const far = new THREE.Vector3(ndcX, ndcY, 1).unproject(camera);

  // Ray-plane intersection at z = 0
  const dir = far.sub(near);
  const t = -near.z / dir.z;
  return new THREE.Vector3(near.x + dir.x * t, near.y + dir.y * t, 0);
}

export function transitionBuffer(
  fromBuffer,
  toBuffer,
  playhead,
  targetValues,
  opts?,
) {
  const fromArr = fromBuffer.array;
  const toArr = toBuffer.array;
  const currentT = playhead.value;

  // Set fromArr to current values
  for (let i = 0; i < fromArr.length; i++) {
    fromArr[i] = fromArr[i] + (toArr[i] - fromArr[i]) * currentT;
  }

  // Set toArr to target values
  for (let i = 0; i < toArr.length; i++) {
    toArr[i] = targetValues[i] ?? 0;
  }

  fromBuffer.needsUpdate = true;
  toBuffer.needsUpdate = true;
  playhead.value = 0;

  return animate(0, 1, {
    duration: opts?.duration ?? 0.5,
    ease: opts?.ease ?? "easeOut",
    onUpdate: (v) => {
      playhead.value = v;
    },
  });
}
