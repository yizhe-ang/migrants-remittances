import { useMemo } from "react";
import {ArcLayer} from '@deck.gl/layers';

export default function useArcLayer({ data, ...props } = {}) {
  return useMemo(() => {
    if (!data) return null;

    return new ArcLayer
  }, [])
}