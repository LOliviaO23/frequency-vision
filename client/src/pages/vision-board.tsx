import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { type Kit, type VisionBoardImage, categoryLabels, type Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Images, Brain, X } from "lucide-react";
import { useState } from "react";

export default function VisionBoard() {
  const { id } = useParams<{ id: string }>();
  const [selectedImage, setSelectedImage] = useState<VisionBoardImage | null>(null);

  const { data: kit, isLoading: kitLoading } = useQuery<Kit>({
    queryKey: ["/api/kits", id],
  });

  const { data: images, isLoading: imagesLoading } = useQuery<VisionBoardImage[]>({
    queryKey: ["/api/kits", id, "vision-board"],
  });

  if (kitLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <Images className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
        <h2 className="font-semibold text-xl mb-2">Kit Not Found</h2>
        <Link href="/kits">
          <Button data-testid="button-back-to-kits">Back to Kits</Button>
        </Link>
      </div>
    );
  }

  const categoryLabel = categoryLabels[kit.category as Category] || kit.category;

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={kit.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-background" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <Link href={`/kits/${kit.id}`}>
            <Button variant="ghost" className="mb-4 gap-2 text-white hover:bg-white/10" data-testid="button-back-to-kit">
              <ArrowLeft className="h-4 w-4" />
              Back to Kit
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="secondary" className="backdrop-blur-sm bg-purple-500/20 text-purple-200 border-purple-500/30 no-default-hover-elevate no-default-active-elevate">
              <Images className="mr-1 h-3 w-3" />
              Vision Board
            </Badge>
            <Badge variant="secondary" className="backdrop-blur-sm bg-white/10 text-white border-white/20 no-default-hover-elevate no-default-active-elevate">
              {categoryLabel}
            </Badge>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white" data-testid="text-vision-board-title">
            {kit.title}
          </h1>
          <p className="text-gray-300 mt-2 max-w-2xl">
            {images?.length || 0} aspirational images to fuel your subconscious mind.
            Let these visuals imprint your deepest desires.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="h-5 w-5 text-purple-400" />
          <p className="text-sm text-muted-foreground">
            Gaze at each image and feel the emotion it creates. Your subconscious absorbs what you focus on with feeling.
          </p>
        </div>

        {imagesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : images && images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
                data-testid={`button-vision-image-${img.id}`}
              >
                <img
                  src={img.imageUrl}
                  alt={img.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-white text-xs font-medium line-clamp-2">{img.label}</span>
                </div>
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-400/40 rounded-lg transition-colors duration-300" />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Images className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Vision Board Coming Soon</h3>
            <p className="text-sm text-muted-foreground">
              Images for this kit are being curated. Check back shortly.
            </p>
          </div>
        )}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
          data-testid="modal-vision-image"
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            data-testid="button-close-modal"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          <div className="relative max-w-4xl max-h-[85vh] mx-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.imageUrl}
              alt={selectedImage.label}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="text-center mt-4">
              <p className="text-white font-serif text-lg">{selectedImage.label}</p>
              <p className="text-purple-300 text-sm mt-1">Breathe deeply. Feel the desire. Let it in.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
