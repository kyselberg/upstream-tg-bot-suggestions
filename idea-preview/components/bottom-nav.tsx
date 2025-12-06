"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { ListIcon, PlusCircle } from "lucide-react";
import LikeButton from "@/components/like-button";

export default function BottomNav() {
  const pathname = usePathname();
  const params = useParams();
  
  // Check if we're on a feedback detail page
  const isFeedbackDetail = pathname?.startsWith("/feedback/") && params?.id;
  const feedbackId = params?.id as string;

  const navItems = [
    {
      href: "/",
      label: "Всі відгуки",
      icon: ListIcon,
    },
    {
      href: "/new",
      label: "Новий відгук",
      icon: PlusCircle,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around h-16">
        {/* Show like button when on feedback detail page */}
        {isFeedbackDetail && (
          <div className="flex items-center justify-center flex-1">
            <LikeButton feedbackId={feedbackId} variant="icon" />
          </div>
        )}
        
        {navItems.map((item) => {
          const isActive = item.href === "/" 
            ? pathname === "/" 
            : pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

