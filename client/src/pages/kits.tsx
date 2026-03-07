import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { type Kit, categories, categoryLabels, type Category } from "@shared/schema";
import { KitCard } from "@/components/kit-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Filter, Brain } from "lucide-react";

export default function Kits() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const activeCategory = params.get("category") || "all";
  const [, setLocation] = useLocation();

  const { data: kits, isLoading } = useQuery<Kit[]>({
    queryKey: ["/api/kits"],
  });

  const filteredKits =
    activeCategory === "all"
      ? kits
      : kits?.filter((k) => k.category === activeCategory);

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/neural-pattern.png" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-pink-900/10" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 w-full h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl space-y-4">
            <Badge variant="secondary" className="gap-1.5 bg-purple-500/20 text-purple-200 border-purple-500/30 backdrop-blur-sm">
              <Brain className="h-3 w-3" />
              Rewire Your Subconscious
            </Badge>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white" data-testid="text-kits-title">
              Digital Movie Kits
            </h1>
            <p className="text-gray-300 max-w-lg text-lg">
              Browse our collection of frequency-powered vision kits. Each kit includes
              curated visuals, healing frequencies, and powerful affirmations to reprogram your mind.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center gap-2 flex-wrap mb-8">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setLocation("/kits")}
            data-testid="button-filter-all"
          >
            All Kits
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setLocation(`/kits?category=${cat}`)}
              data-testid={`button-filter-${cat}`}
            >
              {categoryLabels[cat]}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredKits && filteredKits.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredKits.map((kit) => (
              <KitCard key={kit.id} kit={kit} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No kits found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No kits available in this category yet. Check back soon!
            </p>
            <Button variant="outline" onClick={() => setLocation("/kits")} data-testid="button-clear-filter">
              View All Kits
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
