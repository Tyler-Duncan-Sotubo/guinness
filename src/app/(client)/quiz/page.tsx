// app/quiz/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { MatchdayLayout } from "@/components/layout/matchday-layout";
import { GXButton } from "@/components/ui/gx-button";
import { Progress } from "@/components/ui/progress";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type QuestionType = "single_choice" | "multi_choice";

type QuizOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

type QuizQuestion = {
  id: string;
  eventId: string;
  question: string;
  type: QuestionType;
  options: QuizOption[];
};

// 🔹 Mock football-related quiz – later replace with DB-driven questions
const MOCK_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    eventId: "demo-event",
    question: "Which team has won the most UEFA Champions League titles?",
    type: "single_choice",
    options: [
      { id: "q1o1", text: "FC Barcelona", isCorrect: false },
      { id: "q1o2", text: "AC Milan", isCorrect: false },
      { id: "q1o3", text: "Real Madrid", isCorrect: true },
      { id: "q1o4", text: "Liverpool FC", isCorrect: false },
    ],
  },
  {
    id: "q2",
    eventId: "demo-event",
    question:
      "Which of these players are famous for playing in the Premier League?",
    type: "multi_choice",
    options: [
      { id: "q2o1", text: "Thierry Henry", isCorrect: true },
      { id: "q2o2", text: "Steven Gerrard", isCorrect: true },
      { id: "q2o3", text: "Andrés Iniesta", isCorrect: false },
      { id: "q2o4", text: "Didier Drogba", isCorrect: true },
    ],
  },
  {
    id: "q3",
    eventId: "demo-event",
    question:
      "A standard football match is split into how many halves and minutes?",
    type: "single_choice",
    options: [
      { id: "q3o1", text: "Two halves of 30 minutes", isCorrect: false },
      { id: "q3o2", text: "Two halves of 45 minutes", isCorrect: true },
      { id: "q3o3", text: "Four quarters of 20 minutes", isCorrect: false },
      { id: "q3o4", text: "One 90-minute half", isCorrect: false },
    ],
  },
];

export default function QuizPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams.get("eventId");

  const questions = MOCK_QUESTIONS;
  const maxScore = questions.length;

  // state: answers and navigation
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressValue = ((currentIndex + 1) / totalQuestions) * 100;

  const handleSelectOption = (
    question: QuizQuestion,
    optionId: string,
    checked: boolean
  ) => {
    setAnswers((prev) => {
      const current = prev[question.id] ?? [];

      if (question.type === "single_choice") {
        return { ...prev, [question.id]: [optionId] };
      }

      // multi_choice: toggle
      if (checked) {
        return {
          ...prev,
          [question.id]: Array.from(new Set([...current, optionId])),
        };
      } else {
        return {
          ...prev,
          [question.id]: current.filter((id) => id !== optionId),
        };
      }
    });
  };

  const goNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleSubmit = () => {
    let newScore = 0;

    for (const q of questions) {
      const selected = answers[q.id] ?? [];
      const correctIds = q.options
        .filter((o) => o.isCorrect)
        .map((o) => o.id)
        .sort();

      const selectedSorted = [...selected].sort();

      const isCorrect =
        selectedSorted.length === correctIds.length &&
        selectedSorted.every((id, index) => id === correctIds[index]);

      if (isCorrect) newScore += 1;
    }

    setScore(newScore);
    setShowResultModal(true);
  };

  const isLastQuestion = currentIndex === totalQuestions - 1;
  const currentSelected = answers[currentQuestion.id] ?? [];
  const isMulti = currentQuestion.type === "multi_choice";

  if (!eventId) {
    return (
      <MatchdayLayout>
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <p className="text-sm text-red-400">
            Missing <code>eventId</code>. Please use a valid event link or go
            back to the Match Day page.
          </p>
          <GXButton variant="primary" onClick={() => router.push("/")}>
            Back to homepage
          </GXButton>
        </div>
      </MatchdayLayout>
    );
  }

  return (
    <MatchdayLayout>
      <div className="max-w-3xl mx-auto mt-10 space-y-8">
        {/* Header */}
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
            Match Quiz
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold">
            Test your football knowledge
          </h1>
          <p className="text-sm text-neutral-300">
            Answer each question to earn points for this Guinness Match Day
            event.
          </p>
        </header>

        {/* Progress */}
        <section className="space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span>{Math.round(progressValue)}%</span>
          </div>
          {/* track is bg-neutral-900, indicator is amber */}
          <Progress
            value={progressValue}
            className="h-2 bg-neutral-900 [&>div]:bg-amber-400"
          />
        </section>

        {/* Current question card */}
        <section className="space-y-4">
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-3xl p-5 space-y-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                {isMulti ? "Multiple choice" : "Single choice"}
              </p>
              <p className="text-sm md:text-base text-neutral-100">
                {currentQuestion.question}
              </p>
              {isMulti && (
                <p className="text-[0.7rem] text-amber-300 mt-1">
                  Select all that apply.
                </p>
              )}
            </div>

            <div className="space-y-2 mt-3">
              {currentQuestion.options.map((opt) => {
                const isChecked = currentSelected.includes(opt.id);

                return (
                  <label
                    key={opt.id}
                    className="flex items-center gap-3 text-sm cursor-pointer bg-neutral-900/60 hover:bg-neutral-800/60 border border-neutral-800 rounded-2xl px-3 py-2 transition"
                  >
                    <input
                      type={isMulti ? "checkbox" : "radio"}
                      name={currentQuestion.id}
                      value={opt.id}
                      checked={isChecked}
                      onChange={(e) =>
                        handleSelectOption(
                          currentQuestion,
                          opt.id,
                          e.target.checked
                        )
                      }
                      className="accent-amber-400"
                    />
                    <span className="text-neutral-100">{opt.text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </section>

        {/* Navigation */}
        <footer className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex gap-2 w-full md:w-auto">
              {!isLastQuestion && (
                <GXButton
                  variant="primary"
                  onClick={goNext}
                  className="flex-1 md:flex-none"
                >
                  Next
                </GXButton>
              )}

              {isLastQuestion && (
                <GXButton
                  variant="primary"
                  onClick={handleSubmit}
                  className="flex-1 md:flex-none"
                >
                  Submit quiz
                </GXButton>
              )}
            </div>
          </div>
        </footer>
      </div>

      {/* Result modal */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="max-w-sm bg-black text-white border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Quiz complete
            </DialogTitle>
            <DialogDescription className="text-sm text-neutral-300">
              Here&apos;s how you did on the Match Quiz.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2">
            <p className="text-sm">
              You scored{" "}
              <span className="font-semibold text-amber-300">
                {score} / {maxScore}
              </span>
              .
            </p>
            <p className="text-xs text-neutral-400">
              {score === maxScore
                ? "Perfect score – you really know your football!"
                : score >= Math.ceil(maxScore / 2)
                ? "Nice one – solid Match Day knowledge."
                : "Plenty of room to improve before kick-off!"}
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <GXButton
              variant="primary"
              className="flex-1"
              onClick={() => {
                setShowResultModal(false);
                router.push(`/event-info?eventId=${eventId}`);
              }}
            >
              Back to event
            </GXButton>
            <GXButton
              variant="secondary"
              className="flex-1"
              onClick={() => setShowResultModal(false)}
            >
              Close
            </GXButton>
          </div>
        </DialogContent>
      </Dialog>
    </MatchdayLayout>
  );
}
