"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LikeButtonProps {
  feedbackId: string;
  initialLikesCount?: number;
  variant?: "default" | "icon";
  className?: string;
}

// Generate or retrieve fingerprint
function getFingerprint(): string {
  if (typeof window === "undefined") return "";

  // Try to get from localStorage
  let fingerprint = localStorage.getItem("user_fingerprint");

  if (!fingerprint) {
    // Generate new fingerprint
    fingerprint = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("user_fingerprint", fingerprint);
  }

  return fingerprint;
}

export default function LikeButton({
  feedbackId,
  initialLikesCount = 0,
  variant = "default",
  className = "",
}: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(true);
  const [fingerprint, setFingerprint] = useState("");

  useEffect(() => {
    const fp = getFingerprint();
    setFingerprint(fp);

    // Check if user has liked
    fetch(`/api/feedback/${feedbackId}/like?fingerprint=${fp}`)
      .then((res) => res.json())
      .then((data) => {
        setLiked(data.liked);
        setLikesCount(data.likesCount);
      })
      .catch((error) => console.error("Error checking like:", error))
      .finally(() => setIsLoading(false));
  }, [feedbackId]);

  const handleLike = async () => {
    if (isLoading || !fingerprint) return;

    const previousLiked = liked;
    const previousCount = likesCount;

    // Optimistic update
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);

    try {
      const response = await fetch(`/api/feedback/${feedbackId}/like`, {
        method: liked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fingerprint }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update like");
      }

      setLiked(data.liked);
      setLikesCount(data.likesCount);
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert on error
      setLiked(previousLiked);
      setLikesCount(previousCount);
    }
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLike}
        disabled={isLoading}
        className={`transition-all ${className}`}
        aria-label={liked ? "Прибрати лайк" : "Подобається"}
      >
        <Heart
          className={`h-5 w-5 transition-all ${
            liked
              ? "fill-red-500 text-red-500 scale-110"
              : "text-muted-foreground"
          }`}
        />
      </Button>
    );
  }

  return (
    <Button
      variant={liked ? "default" : "outline"}
      onClick={handleLike}
      disabled={isLoading}
      className={`gap-2 transition-all ${className}`}
    >
      <Heart
        className={`h-4 w-4 transition-all ${
          liked ? "fill-current scale-110" : ""
        }`}
      />
      <span>{likesCount}</span>
      <span className="hidden sm:inline">
        {liked ? "Подобається" : "Подобається"}
      </span>
    </Button>
  );
}

