import { useEffect } from "react";
import { useLenis } from "lenis/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRoomStore } from "@/store";
import { Separator } from "@/components/ui/separator";
import A from "./A";

const About = () => {
  const openAbout = useRoomStore((state) => state.openAbout);
  const setOpenAbout = useRoomStore((state) => state.setOpenAbout);
  const lenis = useLenis();

  useEffect(() => {
    if (openAbout) {
      lenis?.stop();
    } else {
      lenis?.start();
    }

    return () => {
      lenis?.start();
    };
  }, [lenis, openAbout]);

  return (
    <Dialog open={openAbout} onOpenChange={setOpenAbout}>
      <DialogTrigger className="font-bold text-xl cursor-pointer">
        About
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl" initialFocus={false}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Global Remittances and Disasters Atlas
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-3">
            <p>This research project...</p>

            {/* <p>Link to dataset?</p> */}
            {/* The research includes informal outflows? */}
          </div>

          <Separator className="" />

          <div className="space-y-3">
            <p>
              Latest figures for international migration are taken from the
              United Nations’{" "}
              <A href="https://www.un.org/development/desa/pd/content/international-migrant-stock">
                International Migrant Stock
              </A>
              .
            </p>
            <p>
              Latest figures for international remittance flows are taken from
              the World Bank's{" "}
              <A href="https://www.worldbank.org/en/topic/migration/brief/remittances-knomad">
                Global Knowledge Partnership on Migration and Development
                (KNOMAD)
              </A>
              .
            </p>
            <p>
              We obtain information about disasters’ occurrence and impact from
              the{" "}
              <A href="https://doc.emdat.be/">
                Emergency Events Database (EMDAT)
              </A>
              . For the scope of our analysis we concentrate on floods, storms,
              earthquakes, and droughts.
            </p>
          </div>

          <Separator className="" />

          <div>
            <div className="font-bold text-lg">Publication:</div>

            <div>
              Vismara, A., Ali, O., Källner, C., Prieto-Viertel, G., &
              Prieto-Curiel, R. (2025). Migrants as First Responders: A Global
              Estimate of Disaster-Driven Remittances. ArXiv.{" "}
              <A href="https://arxiv.org/abs/2512.16373">
                https://arxiv.org/abs/2512.16373
              </A>
            </div>
          </div>

          <div>
            <div className="font-bold text-lg">Visualization:</div>

            <div>Created by Yi Zhe Ang and supervised by Liuhuaying Yang.</div>
          </div>
        </div>

        <Separator className="" />

        <div className="flex items-center gap-20">
          <div className="h-12">
            <A href="https://www.csh.ac.at/">
              <img className="w-full h-full" src="/csh-logo-web.svg" />
            </A>
          </div>

          <div className="flex flex-col gap-0 text-xl font-bold">
            <div className="text-stone-400">More Visualizations:</div>
            <div>
              <A href="https://vis.csh.ac.at/">CSH Visuals</A>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default About;
