import { cn } from "@/lib/utils";

export type BadgeKey = "pork" | "beef" | "vegetarian";

export const BADGE_OPTIONS: {
  key: BadgeKey;
  label: string;
  icon: string;
  className: string;
}[] = [
  {
    key: "pork",
    label: "Pork",
    icon: "🐖",
    className: "bg-rose-500/90 text-white",
  },
  {
    key: "beef",
    label: "Beef",
    icon: "🐄",
    className: "bg-amber-700/90 text-white",
  },
  {
    key: "vegetarian",
    label: "Vegetarian",
    icon: "🌿",
    className: "bg-emerald-600/90 text-white",
  },
];

export const getBadge = (key: string) =>
  BADGE_OPTIONS.find((b) => b.key === key);

interface MenuBadgesProps {
  badges?: string[] | null;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export const MenuBadges = ({
  badges,
  size = "sm",
  showLabel = true,
  className,
}: MenuBadgesProps) => {
  if (!badges || badges.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {badges.map((key) => {
        const badge = getBadge(key);
        if (!badge) return null;
        return (
          <span
            key={key}
            title={badge.label}
            className={cn(
              "inline-flex items-center gap-1 rounded-full font-medium shadow-sm backdrop-blur-sm",
              badge.className,
              size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2.5 py-1"
            )}
          >
            <span aria-hidden>{badge.icon}</span>
            {showLabel && <span>{badge.label.split(" / ")[0]}</span>}
          </span>
        );
      })}
    </div>
  );
};
