import { useRef } from "react"
import { useRoomStore } from "@/store"

const OFFSET = 12;

const CountryTooltip = () => {
  const ref = useRef(null)
  const hoveredCountry = useRoomStore((state) => state.hoveredCountry)
  const mousePosition = useRoomStore((state) => state.mousePosition)
  const countriesGeoMap = useRoomStore((state) => state.countriesGeoMap)

  if (!hoveredCountry) return null

  const geo = countriesGeoMap?.get(hoveredCountry.country)
  const name = geo?.name ?? hoveredCountry.country

  const w = ref.current?.offsetWidth ?? 0
  const h = ref.current?.offsetHeight ?? 0

  const fitsRight = mousePosition.x + OFFSET + w < window.innerWidth
  const fitsBelow = mousePosition.y + OFFSET + h < window.innerHeight

  const left = fitsRight ? mousePosition.x + OFFSET : mousePosition.x - OFFSET - w
  const top = fitsBelow ? mousePosition.y + OFFSET : mousePosition.y - OFFSET - h

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-50 rounded bg-stone-900 px-2.5 py-1.5 text-xs text-stone-100 shadow-lg"
      style={{ left, top }}
    >
      <div className="font-medium">{name}</div>
      <div className="text-stone-400 capitalize">{hoveredCountry.type}</div>
    </div>
  )
}

export default CountryTooltip
