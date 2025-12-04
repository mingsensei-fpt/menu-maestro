import { Card, CardContent } from "@/components/ui/card";
import { MenuItem } from "@/type/type";

interface MenuItemCardProps {
  item: MenuItem;
  index: number;
}

export const MenuItemCard = ({ item, index }: MenuItemCardProps) => {
  return (
    <Card 
      className="overflow-hidden hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 animate-fade-in group cursor-pointer border border-border/50"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {/* Image */}
      <div className="relative h-56 bg-muted overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/70">
            <span className="text-5xl opacity-30">🍽️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>

      {/* Content */}
      <CardContent className="p-6">
        <h3 className="font-serif text-xl font-bold text-foreground text-center">
          {item.name}
        </h3>
      </CardContent>
    </Card>
  );
};
