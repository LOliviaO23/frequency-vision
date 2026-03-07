import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Waves, Clock, ArrowRight, Brain } from "lucide-react";
import { type Kit, categoryLabels, type Category } from "@shared/schema";

const categoryGradients: Record<string, string> = {
  abundance: "from-amber-500/30 to-yellow-600/20",
  health: "from-emerald-500/30 to-teal-600/20",
  love: "from-pink-500/30 to-rose-600/20",
  confidence: "from-violet-500/30 to-purple-600/20",
  peace: "from-indigo-500/30 to-blue-600/20",
  success: "from-orange-500/30 to-amber-600/20",
  freedom: "from-sky-500/30 to-cyan-600/20",
  manifestation: "from-fuchsia-500/30 to-purple-600/20",
};

const categoryBadgeColors: Record<string, string> = {
  abundance: "bg-amber-500/20 text-amber-300 border-amber-500/20",
  health: "bg-emerald-500/20 text-emerald-300 border-emerald-500/20",
  love: "bg-pink-500/20 text-pink-300 border-pink-500/20",
  confidence: "bg-violet-500/20 text-violet-300 border-violet-500/20",
  peace: "bg-indigo-500/20 text-indigo-300 border-indigo-500/20",
  success: "bg-orange-500/20 text-orange-300 border-orange-500/20",
  freedom: "bg-sky-500/20 text-sky-300 border-sky-500/20",
  manifestation: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/20",
};

export function KitCard({ kit }: { kit: Kit }) {
  const categoryLabel = categoryLabels[kit.category as Category] || kit.category;
  const gradient = categoryGradients[kit.category] || "from-purple-500/30 to-pink-500/20";
  const badgeColor = categoryBadgeColors[kit.category] || "bg-purple-500/20 text-purple-300 border-purple-500/20";

  return (
    <Link href={`/kits/${kit.id}`}>
      <Card
        className="group overflow-visible cursor-pointer hover-elevate transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
        data-testid={`card-kit-${kit.id}`}
      >
        <div className="relative overflow-hidden rounded-t-md">
          <img
            src={kit.thumbnailUrl}
            alt={kit.title}
            className="h-52 w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${gradient} to-transparent`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={`${badgeColor} backdrop-blur-md no-default-hover-elevate no-default-active-elevate`}
            >
              {categoryLabel}
            </Badge>
            <Badge
              variant="secondary"
              className="backdrop-blur-md bg-white/10 text-white border-white/20 no-default-hover-elevate no-default-active-elevate"
            >
              <Waves className="mr-1 h-3 w-3" />
              {kit.frequencyHz} Hz
            </Badge>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <h3 className="font-serif font-bold text-lg leading-tight group-hover:text-purple-400 transition-colors" data-testid={`text-kit-title-${kit.id}`}>
            {kit.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {kit.description}
          </p>
          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" data-testid={`text-kit-price-${kit.id}`}>
                ${(kit.price / 100).toFixed(2)}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {kit.duration} min
              </span>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-purple-400" tabIndex={-1}>
              View Kit
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
