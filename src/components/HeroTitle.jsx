export default function HeroTitle({ className = "" }) {
  return (
    <h1
      className={`pointer-events-auto font-display text-5xl font-bold text-stone-950 sm:text-6xl lg:text-7xl ${className}`}
    >
      Global Remittances <br />
      <span className="text-6xl text-stone-400"> and </span> Disasters Atlas
    </h1>
  );
}
