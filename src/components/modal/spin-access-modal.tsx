// components/widgets/spin-access-modal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GXButton } from "@/components/ui/gx-button";

type SpinAccessMode = "login" | "no-spins";

type SpinAccessModalProps = {
  open: boolean;
  mode: SpinAccessMode;
  onOpenChange: (open: boolean) => void;
  onLoginClick?: () => void;
  dismissible?: boolean;
};

export function SpinAccessModal({
  open,
  mode,
  onOpenChange,
  onLoginClick,
  dismissible = true,
}: SpinAccessModalProps) {
  const isLogin = mode === "login";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md bg-black text-white border-neutral-800"
        onEscapeKeyDown={(e) => {
          if (!dismissible) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (!dismissible) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold leading-tight uppercase">
            {isLogin ? "Login to Spin" : "No Spins Remaining"}
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-300 mt-1">
            {isLogin
              ? "You need to be logged in to play Spin & Win and collect points for this Match Day."
              : "You’ve used all your spins for this event. Check back later or explore other activities."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4 text-sm text-neutral-300">
          {isLogin ? (
            <p>
              Create an account or sign in to keep track of your points,
              participate in leaderboards, and unlock Guinness Match Day
              rewards.
            </p>
          ) : (
            <p>
              Spin & Win is limited per user for each event to keep things fair.
              You can still enjoy the match, quiz, and other on-site
              experiences.
            </p>
          )}
        </div>

        <div className="pt-6 mt-6 border-t border-neutral-900 flex flex-wrap gap-3 justify-end">
          <GXButton
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Close
          </GXButton>

          {isLogin && (
            <GXButton
              type="button"
              variant="primary"
              onClick={() => {
                onOpenChange(false);
                onLoginClick?.();
              }}
            >
              Login to play
            </GXButton>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
