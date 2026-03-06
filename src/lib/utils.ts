import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { color } from "d3-color";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
