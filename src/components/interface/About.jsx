import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const About = () => {
  return (
    <Dialog>
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
