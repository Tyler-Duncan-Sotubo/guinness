"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GXButton } from "../ui/gx-button";
import { saveAgeGate, saveTerms } from "@/lib/consent";
import { useAppContext } from "@/server/provider/app-provider";
import Image from "next/image";

type ConsentResult = {
  ageGatePassed: boolean;
  acceptedTerms: boolean;
};

type ConsentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (result: ConsentResult) => void;
  dismissible?: boolean;
  showCloseButton?: boolean;
  showHeaderCloseButton?: boolean;
};

export function ConsentModal({
  open,
  onOpenChange,
  onComplete,
  dismissible = true,
  showCloseButton = true,
}: ConsentModalProps) {
  const [is18Plus, setIs18Plus] = useState<null | boolean>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);

  const { setConsent } = useAppContext(); // 👈 make sure AppProvider exposes this

  const handleUnder18 = () => setIs18Plus(false);
  const handleOver18 = () => setIs18Plus(true);

  const handleContinue = () => {
    if (!acceptedTerms) {
      setShowTermsError(true);
      return;
    }

    // 1) Persist to localStorage
    saveAgeGate();
    saveTerms(acceptedTerms);

    // 2) Update global context (so SPA navigation sees it immediately)
    setConsent({
      ageGatePassed: true,
      acceptedTerms,
    });

    // 3) Notify parent if needed
    onComplete({
      ageGatePassed: true,
      acceptedTerms,
    });

    // 4) Close if the parent allows
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={showCloseButton}
        className="max-w-md bg-black text-white border-neutral-800"
        onEscapeKeyDown={(e) => {
          if (!dismissible) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (!dismissible) e.preventDefault();
        }}
      >
        <DialogHeader className="relative">
          <DialogTitle className="text-2xl font-semibold leading-tight uppercase"></DialogTitle>
        </DialogHeader>

        {/* ...rest of your existing JSX (age gate, checkbox, button)... */}
        <section className="space-y-4 text-center">
          <div className="relative w-52 h-52 mx-auto">
            <Image
              src="https://res.cloudinary.com/dw1ltt9iz/image/upload/v1763471645/Matchday-Logo_jnj6hl.webp"
              alt="Guinness Matchday"
              fill
              className="object-center"
              priority
            />
          </div>
          {/* Age Gate */}
          <div>
            <h2 className="text-xs md:text-sm font-semibold tracking-[0.18em] uppercase text-neutral-300 mb-3">
              Are you 18 years or older?
            </h2>

            <p className="text-xs text-neutral-400 mb-4">
              You must be of legal drinking age to attend Guinness Match Day
              events.
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              <GXButton
                type="button"
                onClick={handleOver18}
                variant={is18Plus === true ? "primary" : "secondary"}
                className={
                  is18Plus === true
                    ? ""
                    : "text-neutral-100 border border-neutral-700 hover:border-neutral-500"
                }
              >
                Yes, I&apos;m 18+
              </GXButton>

              <GXButton
                type="button"
                onClick={handleUnder18}
                variant="secondary"
                className={
                  is18Plus === false
                    ? "bg-neutral-800 text-neutral-300 border border-red-500/60"
                    : "text-neutral-300 border border-neutral-700 hover:border-neutral-500"
                }
              >
                No, I&apos;m under 18
              </GXButton>
            </div>

            {is18Plus === false && (
              <div className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-2xl p-4">
                <p className="font-semibold mb-1">
                  You must be 18 or older to continue.
                </p>
                <p className="text-[0.7rem] text-red-100/80">
                  Guinness Match Day events are restricted to adults only.
                  Please close this page.
                </p>
              </div>
            )}
          </div>

          {/* Terms Consent */}
          {is18Plus && (
            <div className="border-t border-neutral-800 pt-6 space-y-5">
              <h2 className="text-xs md:text-sm font-semibold tracking-[0.18em] uppercase text-neutral-300">
                Terms &amp; Conditions
              </h2>

              <label className="flex items-start gap-3 cursor-pointer text-xs text-neutral-300">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    if (e.target.checked) setShowTermsError(false);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-neutral-600 bg-neutral-900"
                />
                <span>
                  I confirm that I am of legal drinking age and I accept the{" "}
                  <span className="underline underline-offset-2 decoration-neutral-500">
                    terms &amp; conditions
                  </span>{" "}
                  for Guinness Match Day events.
                </span>
              </label>

              {showTermsError && (
                <p className="text-[0.7rem] text-red-400 mt-1">
                  You must accept the terms to continue.
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
                <GXButton
                  type="button"
                  onClick={handleContinue}
                  disabled={!is18Plus}
                  className={`
                    tracking-[0.22em]
                    disabled:bg-neutral-700 
                    disabled:text-neutral-500 
                    disabled:cursor-not-allowed
                  `}
                >
                  Continue
                </GXButton>

                <p className="text-[0.65rem] text-neutral-500 max-w-xs">
                  Please drink responsibly.
                </p>
              </div>
            </div>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}
