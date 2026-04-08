import CurvedArrow from "@/components/interface/CurvedArrow";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const examples = [
  {
    title: "Single sweep",
    hint: "default point-to-point",
    arrow: (
      <CurvedArrow
        start={{ x: 26, y: 92 }}
        end={{ x: 246, y: 40 }}
        curve={44}
        color="#1f2937"
        label="Default"
      />
    ),
  },
  {
    title: "Mirrored bend",
    hint: "positive and negative curve",
    arrow: (
      <div className="relative h-28">
        <CurvedArrow
          className="absolute inset-0 h-full w-full"
          width="100%"
          height="100%"
          start={{ x: 32, y: 68 }}
          end={{ x: 242, y: 68 }}
          curve={38}
          color="#b45309"
          label="curve: 38"
        />
        <CurvedArrow
          className="absolute inset-0 h-full w-full"
          width="100%"
          height="100%"
          start={{ x: 32, y: 68 }}
          end={{ x: 242, y: 68 }}
          curve={-38}
          color="#0f766e"
          label="curve: -38"
        />
      </div>
    ),
  },
  {
    title: "Dashed motion",
    hint: "custom dash and animation",
    arrow: (
      <CurvedArrow
        start={{ x: 26, y: 86 }}
        end={{ x: 246, y: 36 }}
        curve={56}
        color="#7c3aed"
        dashArray="8 9"
        animated
        label="Animated"
      />
    ),
  },
  {
    title: "Double headed",
    hint: "comparison or feedback loops",
    arrow: (
      <CurvedArrow
        start={{ x: 34, y: 36 }}
        end={{ x: 240, y: 88 }}
        curve={-52}
        color="#be123c"
        headAt="both"
        strokeWidth={3}
        label="Two-way"
      />
    ),
  },
];

function CurvedArrowDemo() {
  return (
    <div className="pointer-events-auto fixed top-20 right-4 z-40 max-h-[calc(100vh-6rem)] w-[min(24rem,calc(100vw-2rem))] overflow-auto md:right-6">
      <Card
        size="sm"
        className="border-stone-950/10 bg-stone-50/90 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-stone-50/75"
      >
        <CardHeader className="gap-2 border-b border-stone-900/10">
          <Badge variant="outline" className="border-stone-900/15 bg-white/70">
            UI Primitive
          </Badge>
          <CardTitle className="font-display text-lg">Curved Arrow</CardTitle>
          <CardDescription className="max-w-[30ch] text-stone-600">
            A reusable SVG arrow with bend, arrowheads, labels, dash styles, and motion.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          {examples.map((example) => (
            <section
              key={example.title}
              className="rounded-xl border border-stone-900/10 bg-white/80 p-3 shadow-sm"
            >
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h3 className="font-medium text-stone-900">{example.title}</h3>
                <span className="text-xs text-stone-500">{example.hint}</span>
              </div>
              <div className="rounded-lg bg-[linear-gradient(180deg,rgba(250,245,240,0.95),rgba(241,245,249,0.9))] p-2 text-stone-900">
                {example.arrow}
              </div>
            </section>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default CurvedArrowDemo;
