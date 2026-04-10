import { cn } from "@/lib/utils";

const STAGES = [
  "Loading data",
  "Preparing views",
  "Starting scene",
  "Ready",
] as const;

type LoadingScreenProps = {
  stage: string;
  visible: boolean;
};

export default function LoadingScreen({
  stage,
  visible,
}: LoadingScreenProps) {
  const stageIndex = Math.max(STAGES.indexOf(stage as (typeof STAGES)[number]), 0);
  const progress = ((stageIndex + 1) / STAGES.length) * 100;
  const heroMask =
    "linear-gradient(to bottom, transparent 0, transparent 7rem, black 15rem, black 100%), radial-gradient(ellipse 34rem 11rem at 50% 7rem, transparent 0, transparent 58%, black 72%)";

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 top-14 z-[30] transition-opacity duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.65),_rgba(245,245,244,0.96)_48%,_rgba(231,229,228,0.98)_100%)]"
        style={{
          WebkitMaskImage: heroMask,
          maskImage: heroMask,
          WebkitMaskComposite: "source-over",
          maskComposite: "add",
        }}
      />
      <div
        className="absolute inset-0 backdrop-blur-md motion-reduce:backdrop-blur-none"
        style={{
          WebkitMaskImage: heroMask,
          maskImage: heroMask,
          WebkitMaskComposite: "source-over",
          maskComposite: "add",
        }}
      />

      <div className="absolute inset-x-0 bottom-8 flex justify-center px-4 sm:bottom-10">
        <div className="w-full max-w-sm rounded-[28px] border border-black/10 bg-stone-50/90 px-5 py-4 shadow-[0_20px_60px_rgba(28,25,23,0.12)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-4 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-stone-500">
            <span>Booting...</span>
            <span aria-live="polite">{stage}</span>
          </div>

          <div className="h-1 overflow-hidden rounded-full bg-stone-200/90">
            <div
              className="h-full rounded-full bg-stone-900 transition-[width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-3 max-w-[24ch] text-sm leading-relaxed text-stone-600">
            Preparing the data story and map scene before we hand over the full
            experience.
          </p>
        </div>
      </div>
    </div>
  );
}
