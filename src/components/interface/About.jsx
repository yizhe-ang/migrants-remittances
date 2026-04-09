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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Global Remittances and Disasters Atlas
          </DialogTitle>
        </DialogHeader>
        <div>This project...</div>
      </DialogContent>
    </Dialog>
  );
};

export default About;
