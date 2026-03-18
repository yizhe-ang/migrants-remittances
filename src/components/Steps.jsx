import { cn } from "@sqlrooms/ui";

const Steps = () => {
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
        <P>
          Interact!
        </P>
      </Step>

      <Step id="step-7-1">
        <P>
          If we were to group countries by their income level, we can see that
          high-income countries dominate the sending of money.
        </P>
      </Step>

      <Step id="step-7">
        <P>
          If we were to group countries by their income level, we can see that
          high-income countries dominate the sending of money.
        </P>
      </Step>

      <Step id="step-8">
        <P>
          In 2019, these high-income countries send $680 billion but only
          receive $195 billion. In other words, people in these countries
          provide 87% of the funds while receiving just 25%. Economic resources
          from high-income countries are being redistributed abroad.
        </P>
      </Step>

      <Step id="step-9" className="h-[300vh]">
        <P>
          Looking at the other income groups individually, we can also see that
          the flows tend to be clustered among the same income-group countries,
          especially for remittance senders living in lower-middle- and
          low-income countries.
        </P>
      </Step>

      <Step id="step-10" className="">
        <P>
          At first glance, The main beneficiaries are middle-income countries.
          Upper-middle-income countries send 7% but receive 30%, and
          lower-middle-income countries send only 4% but receive 44%.
        </P>
        <P>
          This also means that very little money reaches the poorest countries,
          where people need it the most. Low-income countries receive just 1.7%
          of all money sent or brought back by migrants, despite being home to
          9% of the global population.
        </P>
      </Step>

      <Step id="step-11" className="">
        <P>
          These numbers, however, hide the contribution that remittances have
          relative to the wealth of countries. For example, for low-income
          countries, they contribute about 9.8% of their combined GDP.
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
  return <span className={cn("px-1 rounded font-medium", className)} {...props} />;
};

export default Steps;
