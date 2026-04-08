import { cn } from "@/lib/utils";

const A = ({ className, children, ...props }) => {
  return (
    <a
      className={cn("cursor-pointer", className)}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  );
};

export default A;
