import SankeyCharts from "./SankeyCharts";
import GeoCharts from "./GeoCharts";
import DisastersCharts from "./DisastersCharts";
import EurostatmapCharts from "./EurostatmapCharts";
import FlowMap from "./FlowMap";

const Notebook = ({ ...props }) => {
  const {
    migAndRemAvgYear,
    disasters,
    disastersImpactsByMonth,
    migAndRemByIncome,
    migAndRemByRegion,
    migAndRemByDestination,
    migAndRemByOrigin,
  } = props;

  return (
    // TODO: Try out a network visualization?

    <div className="w-full h-full overflow-y-scroll pt-5">
      <div className="text-sm w-xl mx-auto">
        Our estimates show that, between 2010 and 2019, international remittance
        flows across the globe totaled 6.1 trillion USD. This sum is equivalent
        to 0.78% of the global GDP produced over the same time period
      </div>

      <div className="w-xl mx-auto mt-5">
        <span className="font-bold">Remittance flows</span> across the globe,
        between <span className="underline">2010 and 2019</span>
      </div>
      <div className="mt-2">
        <img src="/notebook/flow-map-1.png" />
      </div>

      <FlowMap />

      {migAndRemByIncome && migAndRemAvgYear && (
        <SankeyCharts
          migAndRemByIncome={migAndRemByIncome.toArray()}
          migAndRemByRegion={migAndRemByRegion.toArray()}
          migAndRemAvgYear={migAndRemAvgYear.toArray()}
        />
      )}

      {migAndRemByOrigin && migAndRemByDestination && (
        <GeoCharts
          migAndRemByOrigin={migAndRemByOrigin.toArray()}
          migAndRemByDestination={migAndRemByDestination.toArray()}
        />
      )}

      {/* {migAndRemByDestination && (
        <EurostatmapCharts data={migAndRemByDestination.toArray()} />
      )} */}

      {disasters && disastersImpactsByMonth && (
        <DisastersCharts
          disasters={disasters}
          disastersImpactsByMonth={disastersImpactsByMonth}
        />
      )}

      <div className="h-screen" />
    </div>
  );
};

export default Notebook;
