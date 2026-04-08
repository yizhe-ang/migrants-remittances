import A from "@/components/interface/A";
import About from "@/components/interface/About";

const Header = () => {
  return (
    <div className="fixed w-full flex gap-4 border-b-2 px-6 py-2 pointer-events-auto bg-stone-50 items-center z-100">
      <A href="https://csh.ac.at/visuals/">
        <img src="/csh-logo-star.svg" className="w-5" />
      </A>
      <About />
    </div>
  );
};

export default Header;
