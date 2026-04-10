import { cn } from "@/lib/utils";
import A from "@/components/interface/A";
import About from "@/components/interface/About";

const Header = () => {
  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[80] items-center gap-4 border-b-2 bg-stone-50/92 px-6 py-2 backdrop-blur-md transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
        "pointer-events-auto opacity-100",
        "flex",
      )}
    >
      <A href="https://csh.ac.at/visuals/">
        <img src="/csh-logo-star.svg" className="w-5" />
      </A>
      <About />
    </div>
  );
};

export default Header;
