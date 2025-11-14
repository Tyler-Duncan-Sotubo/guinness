"use client";

export default function Loading() {
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-white/50 z-50">
      <div className="relative w-20 h-20 animate-spin-slow">
        <div className="absolute top-0 left-1/2 w-4 h-4 bg-brand rounded-full transform -translate-x-1/2 animate-orbit" />
        <div className="absolute top-1/4 left-[85%] w-4 h-4 bg-purple-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-orbit" />
        <div className="absolute top-3/4 left-[85%] w-4 h-4 bg-pink-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-orbit" />
        <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-yellow-500 rounded-full transform -translate-x-1/2 animate-orbit" />
        <div className="absolute top-3/4 left-[15%] w-4 h-4 bg-green-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-orbit" />
        <div className="absolute top-1/4 left-[15%] w-4 h-4 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-orbit" />
      </div>
    </div>
  );
}

export const LoadingProgress = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-1.5 z-50 overflow-hidden bg-transparent">
      <div className="h-full bg-brand animate-loading-bar" />
    </div>
  );
};
