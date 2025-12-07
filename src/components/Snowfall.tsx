import { useEffect, useState } from "react";
import snowflakeImage from "@/assets/hexagonal-snowflakes.png";

interface Snowflake {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export const Snowfall = () => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    // Generate random snowflakes
    const flakes: Snowflake[] = [];
    const count = 25; // Number of snowflakes

    for (let i = 0; i < count; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100, // Random horizontal position (%)
        size: Math.random() * 20 + 10, // Size between 10-30px
        duration: Math.random() * 10 + 8, // Fall duration 8-18s
        delay: Math.random() * 10, // Random start delay
        opacity: Math.random() * 0.5 + 0.3, // Opacity 0.3-0.8
      });
    }

    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute snowflake-fall"
          style={{
            left: `${flake.left}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
          }}
        >
          <img
            src={snowflakeImage}
            alt=""
            className="w-full h-full object-contain"
            style={{
              filter: "drop-shadow(0 0 2px rgba(158, 200, 255, 0.5))",
            }}
          />
        </div>
      ))}
    </div>
  );
};
