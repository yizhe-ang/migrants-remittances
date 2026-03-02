import { useMemo } from "react";
import { ResponsiveSankey } from "@nivo/sankey";
import { schemeObservable10 } from "d3-scale-chromatic";

const colorScheme = schemeObservable10;

const nodesOrder = [
  "High income",
  "Upper middle income",
  "Lower middle income",
  "Low income",
];

const regionsOrder = [
  "East Asia & Pacific",
  "South Asia",
  "Middle East & North Africa",
  "Sub-Saharan Africa",
  "Europe & Central Asia",
  "North America",
  "Latin America & Caribbean",
];

const sankeyProps = {
  valueFormat: ".2s",
  margin: {
    top: 10,
    bottom: 10,
  },
  colors: (node) => {
    if (node.id.includes("High income")) {
      return colorScheme[0];
    }
    if (node.id.includes("Upper middle income")) {
      return colorScheme[1];
    }
    if (node.id.includes("Lower middle income")) {
      return colorScheme[2];
    }
    if (node.id.includes("Low income")) {
      return colorScheme[3];
    }
  },
  sort: (a, b) => {
    return nodesOrder.indexOf(a.id) - nodesOrder.indexOf(b.id);
  },
  enableLinkGradient: true,
  theme: {
    tooltip: {
      container: {
        fontSize: 10,
      },
    },
  },
};

const sankeyRegionProps = {
  valueFormat: ".2s",
  margin: {
    top: 10,
    bottom: 10,
  },
  colors: (node) => {
    if (node.id.includes("East Asia & Pacific")) {
      return colorScheme[0];
    }
    if (node.id.includes("South Asia")) {
      return colorScheme[1];
    }
    if (node.id.includes("Middle East & North Africa")) {
      return colorScheme[2];
    }
    if (node.id.includes("Sub-Saharan Africa")) {
      return colorScheme[3];
    }
    if (node.id.includes("Europe & Central Asia")) {
      return colorScheme[4];
    }
    if (node.id.includes("North America")) {
      return colorScheme[5];
    }
    if (node.id.includes("Latin America & Caribbean")) {
      return colorScheme[6];
    }
  },
  sort: (a, b) => {
    return regionsOrder.indexOf(a.id) - regionsOrder.indexOf(b.id);
  },
  enableLinkGradient: true,
  theme: {
    tooltip: {
      container: {
        fontSize: 10,
      },
    },
  },
};

const source = (d) => d.destination_group;
// const target = (d) => d.origin_group;
// const value = (d) => d.sim_remittances_with;

function computeSankeyData(data, source, target, value, sourceRename) {
  const nodesSet = new Set();

  const links = [];

  for (const l of data) {
    const s = sourceRename ? `${source(l)} ${sourceRename}` : source(l);
    const t = target(l);

    nodesSet.add(s);
    nodesSet.add(t);

    links.push({
      source: s,
      target: t,
      value: value(l),
    });
  }

  return {
    links,
    nodes: [...nodesSet].map((id) => ({ id })),
  };
}

function computeIncomeData(data) {
  return computeSankeyData(
    data,
    (d) => d.destination_group,
    (d) => d.origin_group,
    (d) => d.sim_remittances_with,
    "->",
  );
}

function computeRegionData(data) {
  return computeSankeyData(
    data,
    (d) => d.destination_region,
    (d) => d.origin_region,
    (d) => d.sim_remittances_with,
    "->",
  );
}

const SankeyCharts = ({ ...props }) => {
  const { migAndRemByIncome, migAndRemByRegion, migAndRemAvgYear } = props;

  return (
    <div className="flex flex-col items-center gap-4 w-full pt-10">
      <div className="w-xl">
        <div className="">
          <span className="font-bold">Remittance flows</span> for an{" "}
          <span className="underline">average year</span>, grouped by{" "}
          <span className="font-bold">income group</span>
        </div>

        <div className="text-sm mt-2">
          Around 96.5% of the total flows are sent by international migrants
          living in high-income countries. To put it in context, only 72% of
          international migrants live in high-income countries.
        </div>

        <div className="h-[500px] w-full mt-3">
          <ResponsiveSankey
            data={computeIncomeData(migAndRemByIncome)}
            {...sankeyProps}
          />
        </div>

        <div className="text-sm mt-4">
          These numbers, however, hide the contribution that remittances have
          relative to the wealth of countries. In total, 1.1% of the GDP of all
          high-income countries was transferred through international
          remittances between 2010 and 2019. The same sum of money contributed
          0.2% of high-income countries’ GDP, 1.1% of upper-middle income
          countries’ GDP, 5.1% of lower-middle income countries’ GDP, and 9.8%
          of low-income countries’ GDP combined
        </div>
      </div>

      <div className="h-[500px] w-full mt-3 flex gap-4">
        <div className="w-[400px] h-full">
          <ResponsiveSankey
            data={computeIncomeData(
              migAndRemByIncome.filter(
                (d) => source(d) === "Upper middle income",
              ),
            )}
            {...sankeyProps}
          />
        </div>

        <div className="w-[400px] h-full">
          <ResponsiveSankey
            data={computeIncomeData(
              migAndRemByIncome.filter(
                (d) => source(d) === "Lower middle income",
              ),
            )}
            {...sankeyProps}
          />
        </div>

        <div className="w-[400px] h-full">
          <ResponsiveSankey
            data={computeIncomeData(
              migAndRemByIncome.filter((d) => source(d) === "Low income"),
            )}
            {...sankeyProps}
          />
        </div>
      </div>

      <div className="text-sm bg-gray-300">
        [Perform grouping by geographical grouping, continent etc.?]
      </div>

      <div className="w-xl h-[800px]">
        <ResponsiveSankey
          data={computeRegionData(migAndRemByRegion)}
          {...sankeyRegionProps}
        />
      </div>

      <div className="w-xl text-sm">
        Latin America, Eastern Europe, North Africa, and Central Asia received
        the highest remittance per capita. According to our estimate, El
        Salvador, Guyana, and Suriname are the three countries that receive the
        highest amount of remittances per year, with more than a thousand
        dollars per inhabitant on average. Almost all countries in Eastern
        Europe also receive large remittance flows per capita due to high labour
        migration to richer European countries. Countries in central and
        Sub-Saharan Africa receive relatively small remittance inflows because
        most migration from the region occurs within short distances, towards
        countries with low income levels.
      </div>
    </div>
  );
};

export default SankeyCharts;
