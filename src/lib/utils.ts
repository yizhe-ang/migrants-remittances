import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { color } from "d3-color";

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
