"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [time, setTime] = useState("");
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      const hour = now.getHours();

      if (hour < 12) setGreeting("Good Morning");
      else if (hour < 17) setGreeting("Good Afternoon");
      else setGreeting("Good Evening");

      const formatted = now.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
      setTime(formatted);
    }

    updateTime();
    const interval = setInterval(updateTime, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center px-5">
      {/* Dynamic greeting */}
      <p className="text-gray-600 text-xl mb-3">
        {greeting}, Seyi — <span className="text-amber-500">{time}</span>
      </p>

      <h1 className="text-6xl font-black text-amber-500 tracking-tight">
        Welcome Home.
      </h1>

      <p className="mt-4 text-gray-600 text-xl">
        Your dashboard is ready.{" "}
        <span className="font-bold">Let’s make Matchday magic!</span>
      </p>
    </div>
  );
}
