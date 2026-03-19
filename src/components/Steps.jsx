import { cn } from "@sqlrooms/ui";
import { useRoomStore } from "../store";

const Steps = () => {
  const incomeColorScale = useRoomStore((state) => state.incomeColorScale);
  const disasterTypeColorScale = useRoomStore(
    (state) => state.disasterTypeColorScale,
  );

  return (
    <div className="w-full z-10 pointer-events-none">
      <div className="h-screen pointer-events-none" />

      <Step id="step-1">
        <P>
          As of 2024, an estimated 304 million, or 1 in 27 people around the
          world are international migrants.
        </P>
      </Step>

      <Step id="step-2" className="h-[150vh]">
        <P>
          Some of them are driven by better economic opportunities abroad;
          traveling across the world to settle down in another country.
        </P>
      </Step>

      <Step id="step-3">
        <P>
          Billions of dollars flow back across borders, as these migrants also
          regularly <C className="bg-orange-200">send</C> back money to support
          their families and communities.
        </P>
        <P>
          People who <C className="bg-blue-200">receive</C> them can use the
          money to pay school fees, make repairs to their homes, or cover
          medical bills.
        </P>
      </Step>

      <Step id="step-4">
        <P>
          These remittances - estimated in 2023 to total about $857 billion –
          now dwarf official development aid and represent a lifeline for many
          economies. [Show chart here]
        </P>
        <P>
          But where do these transfers actually end up in? Do they flow to
          countries in need, such as low-income and middle-income countries?
        </P>
        <P>
          Despite the importance of remittances, there is a lack of a
          comprehensive dataset of bilateral remittance flows at a high temporal
          resolution.
        </P>
      </Step>

      <Step id="step-6" className="h-[200vh]">
        <P>
          To answer these questions and more, researchers from CSH built a novel
          model to better understand the dynamics and structure of remittance
          flows, simulating and providing new estimates of remittance flows
          between countries from 2010 to 2019 at a monthly level.
        </P>
      </Step>

      {/* <div id="step-dashboard" className="h-[100vh]"></div> */}
      <Step id="step-dashboard-1">
        <P>Interact!</P>
      </Step>

      <Step id="step-7-1">
        <H>Money flows from rich countries to poorer ones</H>
        <P>
          If we were to group countries by their income level, we can see that{" "}
          <C
            style={{
              background: incomeColorScale
                ? `${incomeColorScale("High income")}80`
                : "transparent",
            }}
          >
            high-income countries
          </C>{" "}
          dominate the sending of money.
        </P>
      </Step>

      <Step id="step-7">
        <P>
          Aggregating all the flows by income group will make the picture
          clearer.
        </P>
        <P>
          In 2019, these{" "}
          <C
            style={{
              background: incomeColorScale
                ? `${incomeColorScale("High income")}80`
                : "transparent",
            }}
          >
            high-income countries
          </C>{" "}
          send $640 billion but only receive $89 billion. In other words, people
          in these countries provide 96.5% of the funds while receiving just
          14%. Economic resources from high-income countries are being
          redistributed abroad.
        </P>
      </Step>

      <Step id="step-9" className="h-[300vh]">
        <P>
          Looking at the other income groups individually, we can also see that
          remittances tend to flow "downwards" -- money is sent to the same or
          lower-income groups.
        </P>
      </Step>

      <Step id="step-10" className="">
        <P>
          At first glance, The main beneficiaries are middle-income countries.
          Upper middle income and lower middle income countries receive 35% and
          44% of remittance flows respectively.
        </P>
        <P>
          This also means that very little money reaches the poorest countries,
          where people need it the most.{" "}
          <C
            style={{
              background: incomeColorScale
                ? `${incomeColorScale("Low income")}80`
                : "transparent",
            }}
          >
            low-income countries
          </C>{" "}
          receive just 6% of all money sent or brought back by migrants, despite
          being home to 9% of the global population.
        </P>
      </Step>

      <Step id="step-11" className="">
        <H>Small sums from rich countries go a long way in poorer nations</H>
        <P>
          These numbers, however, hide the contribution that remittances have
          relative to the wealth of countries. For{" "}
          <C
            style={{
              background: incomeColorScale
                ? `${incomeColorScale("Low income")}80`
                : "transparent",
            }}
          >
            low-income countries
          </C>
          , they contribute about 9.8% of their combined GDP.
        </P>
      </Step>

      <Step id="step-12" className="">
        <P>
          Many countries receive remittances in amounts that are large relative
          to their gross domestic product (GDP). In over thirty countries,
          remittances account for more than 10% of the value of their entire
          economies.
        </P>
      </Step>

      <Step id="step-13" className="">
        <P>
          Between 2010 and 2019, there were around 3,000 disaster events
          connected to the occurrence of{" "}
          <C
            style={{
              background: disasterTypeColorScale
                ? `${disasterTypeColorScale("flood")}60`
                : "transparent",
            }}
          >
            floods
          </C>
          ,{" "}
          <C
            style={{
              background: disasterTypeColorScale
                ? `${disasterTypeColorScale("storm")}60`
                : "transparent",
            }}
          >
            storms
          </C>
          ,{" "}
          <C
            style={{
              background: disasterTypeColorScale
                ? `${disasterTypeColorScale("earthquake")}60`
                : "transparent",
            }}
          >
            earthquakes
          </C>
          , and{" "}
          <C
            style={{
              background: disasterTypeColorScale
                ? `${disasterTypeColorScale("drought")}60`
                : "transparent",
            }}
          >
            droughts
          </C>
          . These events affected a total of 1.74 billion people, the vast
          majority of whom lived in lower-middle-income and upper-middle-income
          countries.
        </P>
      </Step>

      <Step id="step-14" className="">
        <P>
          We estimate that the disaster-induced flow of international
          remittances between 2010 and 2019 amounted to around 332 billion USD,
          equivalent to 5.46% of total remittance flows.
        </P>
        <P>
          Floods moved the largest amount of remittances, with a total of 138
          billion USD. This can be attributed to the combination of size and
          frequency of flooding events with their occurrence in countries with
          large international diasporas, such as China, Pakistan and Bangladesh.
        </P>
      </Step>

      <Step id="step-15" className="">
        <P>
          Not all disasters generate the same remittances mobilisation.
          Earthquakes accounted for the largest relative amount, with 542 USD
          per affected person. Earthquakes are sudden and cause large impacts,
          and have occurred in countries with diasporas that could be activated.
        </P>
        <P>
          On the contrary, droughts caused the smallest relative impact, with
          142 USD per affected person. Droughts are a creeping phenomenon: their
          effects accumulate slowly, and they last for prolonged periods of
          time. For this reason, migrant diasporas cannot sustain sending higher
          amounts of remittances for events that last long periods.
        </P>
      </Step>
      <Step id="step-16" className="">
        <P>
          Interact!
        </P>
      </Step>
    </div>
  );
};

const Step = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        "border border-red-300 border-0 h-[100vh] max-w-xl mx-auto pointer-events-none",
        className,
      )}
      {...props}
    >
      <div className="px-4 py-4 bg-white rounded shadow-xl flex flex-col gap-4 pointer-events-auto">
        {children}
      </div>
    </div>
  );
};

const P = ({ className, ...props }) => {
  return <p className={cn("", className)} {...props} />;
};

const C = ({ className, ...props }) => {
  return (
    <span className={cn("px-1 rounded font-medium", className)} {...props} />
  );
};

const H = ({ className, ...props }) => {
  return <h3 className={cn("font-bold", className)} {...props} />;
};

export default Steps;
