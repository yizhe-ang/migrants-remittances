import { cn } from "@sqlrooms/ui";
import { useRoomStore } from "../store";
import { MousePointer } from "lucide-react";
import { numberFormat } from "@/lib/utils";

const Steps = () => {
  const incomeColorScale = useRoomStore((state) => state.incomeColorScale);
  const disasterTypeColorScale = useRoomStore(
    (state) => state.disasterTypeColorScale,
  );
  const colorWithAlpha = (scale, value, alpha) => {
    const color = scale?.(value);
    return color ? `${color}${alpha}` : "transparent";
  };

  return (
    <div className="w-full z-10 pointer-events-none">
      <div className="h-screen pointer-events-none flex justify-center mt-20 perspective-near">
        {/* <h1 className="font-bold text-7xl">
          Migrants,
          <br />
          Remittances<span className="font-normal text-4xl"> and </span>
          <br />
          Disasters
        </h1> */}
        {/* <h1 className="font-bold font-display text-7xl rotate-y-[5deg] pointer-events-auto"> */}
        <h1 className="font-bold font-display text-7xl pointer-events-auto">
          Global Remittances <br />
          <span className="text-6xl text-stone-400"> and </span> Disasters Atlas
        </h1>
      </div>

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

      <Step id="step-3" className="pt-[50vh]">
        <P>
          Billions of dollars flow back across borders, as these migrants also
          regularly{" "}
          <C className="bg-[#dea193]/50 border-2 border-black">send</C> back
          money to support their families and communities.
        </P>
        <P>
          People who <C className="bg-[#dea193]/50">receive</C> them can use the
          money to pay school fees, make repairs to their homes, or cover
          medical bills.
        </P>
        <P>
          The US, for example, has consistently been the top remittance-sending
          country, with a total outflow of $86 billion in 2023. As a{" "}
          <C
            style={{
              background: colorWithAlpha(incomeColorScale, "High income", "80"),
            }}
            className="border-2 border-black"
          >
            high-income
          </C>{" "}
          country, this money is also being sent to other{" "}
          <C
            style={{
              background: colorWithAlpha(
                incomeColorScale,
                "Upper middle income",
                "80",
              ),
            }}
          >
            upper-middle
          </C>
          ,{" "}
          <C
            style={{
              background: colorWithAlpha(
                incomeColorScale,
                "Lower middle income",
                "80",
              ),
            }}
          >
            lower-middle
          </C>
          , and{" "}
          <C
            style={{
              background: colorWithAlpha(incomeColorScale, "Low income", "80"),
            }}
          >
            low-income
          </C>{" "}
          countries.
        </P>
        <P>
          The larger the size of the circle{" "}
          <span className="size-4 inline-block rounded-full bg-[#dea193]/100 translate-y-[2px]" />
          , the larger the amount of remittances sent or received.
        </P>
      </Step>

      <Step id="step-3-1" className="pb-[200vh]">
        <P>
          External shocks such as natural disasters threaten such development.
        </P>
        <P>
          <P>
            Between 2010 and 2019, there were around 3,000 disaster events
            connected to the occurrence of{" "}
            <C
              className="text-white font-normal"
              style={{
                background: colorWithAlpha(
                  disasterTypeColorScale,
                  "flood",
                  "FF",
                ),
              }}
            >
              floods
            </C>
            ,{" "}
            <C
              className="text-white font-normal"
              style={{
                background: colorWithAlpha(
                  disasterTypeColorScale,
                  "storm",
                  "FF",
                ),
              }}
            >
              storms
            </C>
            ,{" "}
            <C
              className="text-white font-normal"
              style={{
                background: colorWithAlpha(
                  disasterTypeColorScale,
                  "earthquake",
                  "FF",
                ),
              }}
            >
              earthquakes
            </C>
            , and{" "}
            <C
              className="text-white font-normal"
              style={{
                background: colorWithAlpha(
                  disasterTypeColorScale,
                  "drought",
                  "FF",
                ),
              }}
            >
              droughts
            </C>
            . These events affected a total of 1.74 billion people, the vast
            majority of whom lived in lower-middle-income and
            upper-middle-income countries.
          </P>
        </P>
        <P>
          Remittance flows have thus been seen as a form of informal insurance,
          surging in the aftermath of natural disasters, and often arriving
          faster and more directly than official aid.
        </P>
      </Step>

      <Step id="step-4" childrenClassName="border-none bg-transparent">
        <P>
          These remittances - estimated in 2023 to total about $857 billion –
          now dwarf official development aid and represent a lifeline for many
          economies.
          {/* [Show chart here] */}
        </P>
        <P>
          But where do these transfers actually end up in? Do they flow to
          countries in need, such as low-income and middle-income countries? To
          what extent is money mobilised in response to disasters?
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
          between countries from 2010 to 2019 at a monthly level, including
          remittances in response to disasters.
        </P>
      </Step>

      {/* <div id="step-dashboard" className="h-[100vh]"></div> */}
      <Step id="step-dashboard-1" empty></Step>

      <Step id="step-7-1">
        <H>Money flows from rich countries to poorer ones</H>
        <P>
          If we were to group countries by their income level, we can see that{" "}
          <C
            style={{
              background: colorWithAlpha(incomeColorScale, "High income", "80"),
            }}
          >
            high-income countries
          </C>{" "}
          seem to dominate the sending of money.
        </P>
      </Step>

      <Step id="step-7" className="pt-[100vh]">
        <P>
          Aggregating all the flows by income group will make the picture
          clearer.
        </P>
        <P>
          In 2019, these{" "}
          <C
            style={{
              background: colorWithAlpha(incomeColorScale, "High income", "80"),
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
              background: colorWithAlpha(incomeColorScale, "Low income", "80"),
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
              background: colorWithAlpha(incomeColorScale, "Low income", "80"),
            }}
          >
            low-income countries
          </C>
          , they contribute about 9.8% of their combined GDP.
        </P>
      </Step>

      <Step id="step-12" className="pt-[100vh]">
        <P>
          Many countries receive remittances in amounts that are large relative
          to their gross domestic product (GDP). In over thirty countries,
          remittances account for more than 10% of the value of their entire
          economies.
        </P>
      </Step>

      <Step id="step-12-1" className="" empty></Step>

      <Step id="step-13" className="pt-[100vh]">
        <P>
          Between 2010 and 2019, there were around 3,000 disaster events
          connected to the occurrence of{" "}
          <C
            className="text-white font-normal"
            style={{
              background: colorWithAlpha(disasterTypeColorScale, "flood", "FF"),
            }}
          >
            floods
          </C>
          ,{" "}
          <C
            className="text-white font-normal"
            style={{
              background: colorWithAlpha(disasterTypeColorScale, "storm", "FF"),
            }}
          >
            storms
          </C>
          ,{" "}
          <C
            className="text-white font-normal"
            style={{
              background: colorWithAlpha(
                disasterTypeColorScale,
                "earthquake",
                "FF",
              ),
            }}
          >
            earthquakes
          </C>
          , and{" "}
          <C
            className="text-white font-normal"
            style={{
              background: colorWithAlpha(
                disasterTypeColorScale,
                "drought",
                "FF",
              ),
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
        <H>Remittances respond differently to disaster types</H>
        <P>
          We estimate that the disaster-induced flow of international
          remittances between 2010 and 2019 amounted to around 332 billion USD,
          equivalent to 5.46% of total remittance flows.
        </P>
        <P>
          <C
            className="text-white font-normal"
            style={{
              background: colorWithAlpha(disasterTypeColorScale, "flood", "FF"),
            }}
          >
            Floods
          </C>{" "}
          moved the largest amount of remittances, with a total of $138 billion.
          This can be attributed to the combination of size and frequency of
          flooding events with their occurrence in countries with large
          international diasporas, such as China, Pakistan and Bangladesh.
        </P>
      </Step>

      <Step id="step-15-1" className="pt-[50vh]" empty></Step>

      <Step id="step-15" className="pt-[0vh]">
        <P>Not all disasters generate the same remittances mobilisation.</P>
        <P>
          Aggregating all disasters within each type, we can see that the scale
          of impact of each disaster type varies significantly. For example,{" "}
          <C
            className="text-white font-normal"
            style={{
              background: colorWithAlpha(
                disasterTypeColorScale,
                "drought",
                "FF",
              ),
            }}
          >
            droughts
          </C>{" "}
          impact an enormous number of people in absolute amounts, for a total
          of 676 million people affected from 2010 to 2019.
        </P>
      </Step>

      <Step id="step-15-2" className="">
        <P>
          However, in terms of the amount of remittances mobilized for each
          single person,{" "}
          <C
            className="text-white font-normal"
            style={{
              background: colorWithAlpha(
                disasterTypeColorScale,
                "earthquake",
                "FF",
              ),
            }}
          >
            earthquakes
          </C>{" "}
          accounted for the largest amount, with $542 per affected person.
          Earthquakes are sudden and cause large impacts, and have occurred in
          countries with diasporas that could be activated.
        </P>
        <P>
          On the contrary,{" "}
          <C
            className="text-white font-normal"
            style={{
              background: colorWithAlpha(
                disasterTypeColorScale,
                "drought",
                "FF",
              ),
            }}
          >
            droughts
          </C>{" "}
          caused the smallest relative impact, with $142 per affected person.
          Droughts are a creeping phenomenon: their effects accumulate slowly,
          and they last for prolonged periods of time. For this reason, migrant
          diasporas cannot sustain sending higher amounts of remittances for
          events that last long periods.
        </P>
      </Step>

      <Step id="step-16-1" className="">
        <P className=""></P>
      </Step>

      <Step id="step-16" className="">
        <P className="flex gap-2">
          <MousePointer />
          Interact to explore the data!
        </P>
        <P>
          <ul className="list-disc px-5">
            <li>Hover over each country to see the remittance flows</li>
            <li>Show countries sending or receiving remittances</li>
            <li>
              Size each country by the absolute value of remittances, or by the
              proportion of its GDP
            </li>
          </ul>
        </P>
      </Step>
    </div>
  );
};

const Step = ({
  className,
  empty = false,
  childrenClassName,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "border-red-300 border-0 pb-[100vh] max-w-xl mx-auto pointer-events-none",
        className,
      )}
      {...props}
    >
      {!empty && (
        <div
          className={cn(
            "px-4 py-4 bg-white rounded-sm border-2 border-stone-300 flex flex-col gap-4 pointer-events-auto",
            childrenClassName,
          )}
        >
          {children}
        </div>
      )}
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
