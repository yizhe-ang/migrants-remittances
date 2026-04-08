import { Mouse } from "lucide-react";
import { cn } from "@/lib/utils";

const ScrollIndicator = () => {
  return (
    <div
      id="scroll-indicator"
      className={
        "fixed bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center"
      }
    >
      <Mouse className="data-animate:animate-bounce" data-animate={true} />
      <div>scroll</div>
    </div>
  );
};

export default ScrollIndicator;
