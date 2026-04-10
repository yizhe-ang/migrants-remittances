import { Mouse } from "lucide-react";
import { cn } from "@/lib/utils";

const ScrollIndicator = () => {
  return (
    <div
      id="scroll-indicator"
      className="group fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center pointer-events-none"
      data-animate={true}
    >
      <Mouse className="group-data-animate:animate-bounce" />
      <div>scroll</div>
    </div>
  );
};

export default ScrollIndicator;
