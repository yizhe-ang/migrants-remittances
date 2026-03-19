import { LegendSize, LegendItem, LegendLabel } from "@visx/legend";
import { useRoomStore } from "@/store";
import { moneyFormat } from "@/lib/utils";

const SizeScale = () => {
  const remRadiusScale = useRoomStore((state) => state.remRadiusScale);
  const propsGdpRadiusScale = useRoomStore(
    (state) => state.propsGdpRadiusScale,
  );

  return (
    <LegendSize scale={remRadiusScale}>
      {(labels) =>
        labels.map((label) => {
          const size = remRadiusScale(label.datum) * 5 ?? 0;
          // const color = sizeColorScale(label.datum);
          const color = "black"
          return (
            <LegendItem
              key={`legend-${label.text}-${label.index}`}
              onClick={() => {
                if (events) alert(`clicked: ${JSON.stringify(label)}`);
              }}
            >
              <svg width={size} height={size} style={{ margin: "5px 0" }}>
                <circle fill={color} r={size / 2} cx={size / 2} cy={size / 2} />
              </svg>
              <LegendLabel align="left" margin="0 4px" className="text-sm">
                {moneyFormat.format(label.text)}
              </LegendLabel>
            </LegendItem>
          );
        })
      }
    </LegendSize>
  );
};

export default SizeScale;
