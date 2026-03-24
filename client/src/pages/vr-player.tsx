import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type Kit } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Headphones,
  Smartphone,
  Monitor,
  Sparkles,
  Waves,
  Play,
  Info,
  Globe,
} from "lucide-react";

export default function VRPlayer() {
  const { id } = useParams<{ id: string }>();

  const { data: kit, isLoading } = useQuery<Kit>({
    queryKey: ["/api/kits", id],
  });

  const vrUrl = `/vr-player.html?kitId=${id}`;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted-foreground">Kit not found.</p>
        <Link href="/kits"><Button className="mt-4">Browse Kits</Button></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <Link href={`/kits/${id}`}>
        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground" data-testid="button-back-vr">
          <ArrowLeft className="h-4 w-4" />
          Back to Kit
        </Button>
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-indigo-950 to-black" />
        {/* Animated rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 rounded-full border border-violet-500/10 animate-pulse" />
          <div className="absolute w-48 h-48 rounded-full border border-purple-500/15" style={{ animation: 'spin 12s linear infinite' }} />
          <div className="absolute w-32 h-32 rounded-full border border-pink-500/10" style={{ animation: 'spin 8s linear infinite reverse' }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <div className="relative p-8 sm:p-12 text-center space-y-5">
          <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 no-default-hover-elevate no-default-active-elevate" data-testid="badge-vr-label">
            VR EXPERIENCE
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight" data-testid="text-vr-title">
            {kit.title}
          </h1>
          <p className="text-violet-300/70 text-sm max-w-md mx-auto">
            Immerse yourself in a 360° galaxy. Your affirmations float around you
            as the {kit.frequencyHz} Hz frequency guides your subconscious into
            deep theta state.
          </p>
          <div className="flex items-center justify-center gap-3 text-xs text-white/40">
            <Waves className="h-3 w-3 text-violet-400" />
            <span>{kit.frequencyHz} Hz · {kit.frequencyType}</span>
          </div>

          <a href={vrUrl} target="_blank" rel="noopener noreferrer" data-testid="link-launch-vr">
            <Button
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-0 shadow-lg shadow-violet-500/30 text-base px-8 py-6"
              size="lg"
              data-testid="button-launch-vr"
            >
              <Play className="mr-2 h-5 w-5" />
              Launch VR Experience
            </Button>
          </a>
          <p className="text-xs text-white/30">Opens in a new tab · Works in any browser</p>
        </div>
      </div>

      {/* Compatible devices */}
      <div className="space-y-3">
        <h2 className="font-serif font-bold text-lg">Compatible Devices</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Headphones,
              title: "VR Headset",
              desc: "Meta Quest, Quest 2/3/Pro · Full immersive experience with spatial tracking",
              color: "text-violet-400",
              bg: "bg-violet-500/10",
              border: "border-violet-500/20",
            },
            {
              icon: Smartphone,
              title: "Mobile",
              desc: "iPhone & Android · Google Cardboard supported · Gyroscope head tracking",
              color: "text-pink-400",
              bg: "bg-pink-500/10",
              border: "border-pink-500/20",
            },
            {
              icon: Monitor,
              title: "Desktop",
              desc: "Click and drag to look around · No headset required",
              color: "text-blue-400",
              bg: "bg-blue-500/10",
              border: "border-blue-500/20",
            },
          ].map(({ icon: Icon, title, desc, color, bg, border }, i) => (
            <Card key={i} className={`p-4 border ${border} ${bg} space-y-2`} data-testid={`card-device-${i}`}>
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="font-semibold text-sm">{title}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* How to use */}
      <Card className="p-6 space-y-4 border-violet-500/10 bg-violet-500/5">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-violet-400" />
          <h2 className="font-serif font-bold text-base">Getting the Most from VR</h2>
        </div>
        <div className="space-y-3">
          {[
            {
              step: "1",
              text: "Put on headphones before entering — the theta binaural beats require stereo audio to work.",
            },
            {
              step: "2",
              text: "Find a quiet space where you can sit comfortably for 5-10 minutes without distraction.",
            },
            {
              step: "3",
              text: "Let each affirmation sink in before it cycles. Feel the truth of each statement as you read it.",
            },
            {
              step: "4",
              text: "On Meta Quest: use the browser's Enter VR button for full immersion and head tracking.",
            },
          ].map(({ step, text }, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-400">
                {step}
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* WebXR note */}
      <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/2 p-4">
        <Globe className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          This VR experience uses WebXR — an open web standard built into modern browsers.
          No app download required. For the best Meta Quest experience, open this page in
          the Quest browser and tap "Enter VR".
        </p>
      </div>

      <div className="flex justify-center">
        <a href={vrUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="gap-2" data-testid="button-launch-vr-bottom">
            <Sparkles className="h-4 w-4 text-violet-400" />
            Launch VR Experience
          </Button>
        </a>
      </div>
    </div>
  );
}
