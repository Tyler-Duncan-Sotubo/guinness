"use client";

export default function Loading() {
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-white/50 z-50">
      {/* uses your `spin-slow` animation from tailwind.config */}
      <div className="relative w-20 h-20 animate-spin-slow">
        {/* Dot 1 */}
        <div className="absolute top-0 left-1/2 w-4 h-4 bg-amber-400 rounded-full transform -translate-x-1/2 animate-ball-1" />
        {/* Dot 2 */}
        <div className="absolute top-1/4 left-[85%] w-4 h-4 bg-amber-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-ball-2" />
        {/* Dot 3 */}
        <div className="absolute top-3/4 left-[85%] w-4 h-4 bg-amber-100 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-ball-3" />
        {/* Dot 4 */}
        <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-black rounded-full transform -translate-x-1/2 animate-ball-4" />
        {/* Dot 5 */}
        <div className="absolute top-3/4 left-[15%] w-4 h-4 bg-amber-300 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-ball-2" />
        {/* Dot 6 */}
        <div className="absolute top-1/4 left-[15%] w-4 h-4 bg-amber-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-ball-3" />
      </div>
    </div>
  );
}
