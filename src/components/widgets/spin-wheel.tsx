// components/widgets/spin-wheel.tsx
"use client";

import { useState, useMemo } from "react";
import WheelComponent from "@/components/widgets/WheelComponent";
import { SpinAccessModal } from "../modal/spin-access-modal";

const segments = [
  "Better luck",
  "+5 Points",
  "Free Guinness",
  "+10 Points",
  "Better luck",
  "Guinness Merch",
  "+20 Points",
  "VIP Upgrade",
];

const segColors = [
  "#0A0A0A", // 1 - Black
  "#fbbf24", // 2 - Amber
  "#1A1A1A", // 3 - Deep stout
  "#fbbf24", // 4 - Amber
  "#0A0A0A", // 5 - Black
  "#fbbf24", // 6 - Amber
  "#1A1A1A", // 7 - Deep stout
  "#fbbf24", // 8 - Amber
];

type SpinnerProps = {
  isLoggedIn: boolean;
  remainingSpins: number;
  onLoginClick?: () => void;
  onSpinFinished?: (winner: string) => void;
  dismissibleModal?: boolean;
};

export default function Spinner({
  isLoggedIn,
  remainingSpins,
  onLoginClick,
  onSpinFinished,
  dismissibleModal = true,
}: SpinnerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "no-spins">("login");

  const canSpinNow = useMemo(
    () => isLoggedIn && remainingSpins > 0,
    [isLoggedIn, remainingSpins]
  );

  const handleFinished = (winner: string) => {
    console.log("Spin result:", winner);
    onSpinFinished?.(winner);
  };

  console.log(
    "Spinner - isLoggedIn:",
    isLoggedIn,
    "remainingSpins:",
    remainingSpins,
    "canSpinNow:",
    canSpinNow
  );

  const handleBlockedClick = () => {
    // Extra safety: if props say we *can* spin, ignore any rogue blocked call.
    if (canSpinNow) {
      console.warn(
        "Wheel reported blocked spin even though canSpinNow is true – ignoring."
      );
      return;
    }

    if (!isLoggedIn) {
      setModalMode("login");
      setModalOpen(true);
      return;
    }

    // logged in but no spins left
    setModalMode("no-spins");
    setModalOpen(true);
  };

  return (
    <>
      <div>
        <WheelComponent
          segments={segments}
          segColors={segColors}
          winningSegment={undefined}
          onFinished={handleFinished}
          primaryColor="black"
          contrastColor="white"
          buttonText="Start"
          isOnlyOnce={false}
          size={190}
          upDuration={500}
          downDuration={600}
          fontFamily="Helvetica"
          canSpin={canSpinNow}
          onBlockedSpin={handleBlockedClick}
        />
      </div>

      <SpinAccessModal
        open={modalOpen}
        mode={modalMode}
        onOpenChange={setModalOpen}
        onLoginClick={!isLoggedIn ? onLoginClick : undefined}
        dismissible={dismissibleModal}
      />
    </>
  );
}
