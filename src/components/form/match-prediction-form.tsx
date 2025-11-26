// components/predict/match-prediction-form.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { GXButton } from "@/components/ui/gx-button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type MatchPredictionFormValues = {
  homeScore: string;
  awayScore: string;
};

type MatchPredictionFormProps = {
  homeTeam: string;
  awayTeam: string;

  /** NEW: Allow loading previous prediction */
  defaultHomeScore?: number | null;
  defaultAwayScore?: number | null;

  onSubmitPrediction: (data: { homeScore: number; awayScore: number }) => void;
};

export function MatchPredictionForm({
  homeTeam,
  awayTeam,
  defaultHomeScore = null,
  defaultAwayScore = null,
  onSubmitPrediction,
}: MatchPredictionFormProps) {
  const form = useForm<MatchPredictionFormValues>({
    defaultValues: {
      homeScore: defaultHomeScore !== null ? String(defaultHomeScore) : "",
      awayScore: defaultAwayScore !== null ? String(defaultAwayScore) : "",
    },
  });

  // IMPORTANT: When match changes OR defaults change → update form
  useEffect(() => {
    form.reset({
      homeScore: defaultHomeScore !== null ? String(defaultHomeScore) : "",
      awayScore: defaultAwayScore !== null ? String(defaultAwayScore) : "",
    });
  }, [defaultHomeScore, defaultAwayScore, homeTeam, awayTeam, form]);

  const scoreOptions = Array.from({ length: 11 }, (_, i) => String(i));

  const handleSubmit = (values: MatchPredictionFormValues) => {
    onSubmitPrediction({
      homeScore: Number(values.homeScore),
      awayScore: Number(values.awayScore),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="flex flex-wrap sm:flex-row items-center gap-4">
          {/* HOME */}
          <FormField
            control={form.control}
            name="homeScore"
            rules={{ required: "Required" }}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="block text-[9px] font-semibold uppercase tracking-widest text-neutral-400">
                  {homeTeam}
                </FormLabel>

                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full bg-neutral-950/80 border-neutral-700 text-lg font-semibold text-white">
                      <SelectValue placeholder="Score" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-950 border-neutral-800 text-lg text-white">
                      {scoreOptions.map((value) => (
                        <SelectItem
                          key={value}
                          value={value}
                          className="text-lg font-semibold text-white"
                        >
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>

                <FormMessage className="text-xs text-red-400" />
              </FormItem>
            )}
          />

          {/* AWAY */}
          <FormField
            control={form.control}
            name="awayScore"
            rules={{ required: "Required" }}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="block text-[9px] font-semibold uppercase tracking-widest text-neutral-400">
                  {awayTeam}
                </FormLabel>

                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full bg-neutral-950/80 border-neutral-700 text-lg font-semibold text-white">
                      <SelectValue placeholder="Score" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-950 border-neutral-800 text-lg text-white">
                      {scoreOptions.map((value) => (
                        <SelectItem
                          key={value}
                          value={value}
                          className="text-lg font-semibold text-white"
                        >
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>

                <FormMessage className="text-xs text-red-400" />
              </FormItem>
            )}
          />
        </div>

        <GXButton type="submit" variant="primary" className="w-full sm:w-auto">
          Submit Prediction
        </GXButton>
      </form>
    </Form>
  );
}
