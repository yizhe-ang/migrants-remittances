import { useRoomStore } from "@/store"

const CountryTooltip = () => {
  const hoveredCountry = useRoomStore((state) => state.hoveredCountry)
  const selectedCountry = useRoomStore((state) => state.selectedCountry)

  return (
    <></>
  )
}

export default CountryTooltip