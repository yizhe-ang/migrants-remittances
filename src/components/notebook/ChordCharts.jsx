import { ResponsiveChord } from "@nivo/chord";
import { union } from "d3-array";
import { useMemo } from "react";

// With just color, same-width edges
// With hierarchical bundling

const incomeGroups = [
  "High income",
  "Upper middle income",
  "Lower middle income",
  "Low income",
];

const ChordCharts = ({ ...props }) => {
  const { migAndRemByIncome, migAndRemByRegion, migAndRemAvgYear } = props;

  console.log(migAndRemByIncome);

  const migAndRemByIncomeMatrix = useMemo(() => {
    const data = migAndRemByIncome;

    // const names = Array.from(
    //   union(data.flatMap((d) => [d.origin_group, d.destination_group])),
    // );
    const names = incomeGroups;
    const index = new Map(names.map((name, i) => [name, i]));
    const matrix = Array.from(index, () => new Array(names.length).fill(0));

    for (const {
      destination_group: source,
      origin_group: target,
      sim_remittances_with: value,
    } of data)
      matrix[index.get(source)][index.get(target)] += value;

    return matrix;
  }, [migAndRemByIncome]);

  console.log(migAndRemByIncomeMatrix);

  return (
    <>
      <div className="h-[700px]">
        <ResponsiveChord data={migAndRemByIncomeMatrix}
          keys={incomeGroups}
        />
      </div>
    </>
  );
};

export default ChordCharts;
