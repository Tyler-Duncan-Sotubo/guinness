"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormField,
  FormMessage,
} from "@/components/ui/form";
import { api, isAxiosError } from "@/lib/axios";
import { useCreateMutation } from "@/hooks/use-create-mutation";
import { useUpdateMutation } from "@/hooks/use-update-mutation";
import FormError from "@/components/ui/form-error";
import { Button } from "@/components/ui/button";
import Loading from "@/components/ui/loading";

// date-fns helpers
import { parse, parseISO, isValid, formatISO, format } from "date-fns";

/* ---------------------------------------
   Schema: eventId is REQUIRED but hidden
---------------------------------------- */
const schema = z.object({
  eventId: z.string().uuid("Invalid event"), // hidden
  homeTeam: z.string().min(1, "Home team is required"),
  awayTeam: z.string().min(1, "Away team is required"),
  kickoffAt: z.string().min(1, "Kickoff time is required"),
  externalFixtureId: z.string().min(1, "External fixture ID is required"),
});

export type MatchFormValues = z.input<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  isEditing?: boolean;
  id?: string;
  initial?: Partial<MatchFormValues> & { id?: string };
};

// Shape of fixtures returned by /api/fixtures/by-round
type FixtureItem = {
  fixtureId: number;
  date: string; // ISO
  homeTeam: string;
  awayTeam: string;
};

const LEAGUE = "PL"; // Premier League for now

export default function MatchModal({
  isOpen,
  onClose,
  isEditing = false,
  id,
  initial,
}: Props) {
  const [error, setError] = useState<string | null>(null);

  const [season, setSeason] = useState("2025");
  const [round, setRound] = useState("");
  const [fixtures, setFixtures] = useState<FixtureItem[]>([]);
  const [fixturesError, setFixturesError] = useState<string | null>(null);
  const [isLoadingFixtures, setIsLoadingFixtures] = useState(false);
  const [selectedFixtureId, setSelectedFixtureId] = useState<number | null>(
    null
  );

  const form = useForm<MatchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      eventId: "",
      homeTeam: "",
      awayTeam: "",
      kickoffAt: "",
      externalFixtureId: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;

    form.reset({
      eventId: initial?.eventId ?? "",
      homeTeam: initial?.homeTeam ?? "",
      awayTeam: initial?.awayTeam ?? "",
      kickoffAt: initial?.kickoffAt ? toLocalDateTime(initial!.kickoffAt) : "",
      externalFixtureId: initial?.externalFixtureId ?? "",
    });

    setError(null);
    setFixturesError(null);
    setFixtures([]);
    setSelectedFixtureId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, id, isEditing]);

  const createMatch = useCreateMutation<MatchFormValues>({
    endpoint: `/matches/`,
    successMessage: "Match created successfully",
    refetchKey: "matches",
  });

  const updateMatch = useUpdateMutation<MatchFormValues>({
    endpoint: `/matches/${id}`,
    successMessage: "Match updated successfully",
    refetchKey: "matches",
  });

  const onSubmit = async (values: MatchFormValues) => {
    setError(null);

    const kickoffISO = toISOFromLocal(values.kickoffAt);
    if (!kickoffISO) {
      setError("Invalid kickoff date/time");
      return;
    }

    const dto = {
      ...values,
      kickoffAt: kickoffISO,
    };

    try {
      if (isEditing && id) {
        await updateMatch(dto, setError, onClose);
      } else {
        await createMatch(dto, setError, onClose);
      }
    } catch (e) {
      if (isAxiosError(e))
        setError(e.response?.data?.error ?? "Failed to save match.");
      else setError("Failed to save match.");
    }
  };

  // Load fixtures from football-data.org via our backend
  const loadFixtures = async () => {
    setFixturesError(null);
    setIsLoadingFixtures(true);
    setFixtures([]);
    setSelectedFixtureId(null);

    if (!round) {
      setFixturesError("Enter a round (matchday number).");
      setIsLoadingFixtures(false);
      return;
    }

    try {
      const res = await api.get("/fixtures", {
        params: {
          league: LEAGUE,
          season,
          round,
        },
      });

      const items = (res.data.items ?? []) as FixtureItem[];

      if (!items.length) {
        setFixturesError("No fixtures found for that round.");
      } else {
        setFixtures(items);
      }
    } catch (e) {
      console.error("Error loading fixtures", e);
      if (isAxiosError(e)) {
        setFixturesError(e.response?.data?.error ?? "Failed to load fixtures.");
      } else {
        setFixturesError("Failed to load fixtures.");
      }
    } finally {
      setIsLoadingFixtures(false);
    }
  };

  // When admin picks a fixture, fill form fields from that choice
  const handlePickFixture = (fixture: FixtureItem) => {
    setSelectedFixtureId(fixture.fixtureId);

    form.setValue("homeTeam", fixture.homeTeam, { shouldValidate: true });
    form.setValue("awayTeam", fixture.awayTeam, { shouldValidate: true });
    form.setValue("kickoffAt", toLocalDateTime(fixture.date), {
      shouldValidate: true,
    });
    form.setValue("externalFixtureId", String(fixture.fixtureId), {
      shouldValidate: true,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Match" : "Add Match"}
      confirmText={isEditing ? "Update" : "Add"}
      onConfirm={form.handleSubmit(onSubmit)}
      isLoading={form.formState.isSubmitting}
    >
      {/* Fixture picker (league/season/round + list) */}
      <div className="space-y-3 my-4 border border-neutral-800 rounded-xl p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
          1 · Choose fixture Premier League {season}, Round {round || "??"}
        </p>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-28">
            <label className="block text-xs text-neutral-400 mb-1">
              League
            </label>
            <Input value={LEAGUE} disabled />
          </div>

          <div className="w-28">
            <label className="block text-xs text-neutral-400 mb-1">
              Season
            </label>
            <Input
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="2025"
            />
          </div>

          <div className="w-28">
            <label className="block text-xs text-neutral-400 mb-1">
              Matchweek
            </label>
            <Input
              value={round}
              onChange={(e) => setRound(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>

          <Button
            type="button"
            onClick={loadFixtures}
            disabled={isLoadingFixtures}
          >
            {isLoadingFixtures ? "Loading..." : "Load fixtures"}
          </Button>
        </div>

        {fixturesError && (
          <p className="text-xs text-red-400 mt-1">{fixturesError}</p>
        )}

        {isLoadingFixtures && (
          <div className="mt-2">
            <Loading />
          </div>
        )}

        {fixtures.length > 0 && (
          <div className="max-h-64 overflow-auto border border-neutral-800 rounded-lg mt-2">
            {fixtures.map((f) => (
              <button
                key={f.fixtureId}
                type="button"
                onClick={() => handlePickFixture(f)}
                className={`w-full text-left px-3 py-2 text-sm border-b border-neutral-800 last:border-b-0 hover:bg-neutral-900/60 ${
                  selectedFixtureId === f.fixtureId
                    ? "bg-neutral-900/80"
                    : "bg-neutral-950/40"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {f.homeTeam} <span className="text-xs">vs</span>{" "}
                      {f.awayTeam}
                    </p>
                    <p className="text-[0.7rem] text-neutral-400">
                      {format(parseISO(f.date), "dd MMM yyyy, HH:mm")} UTC
                    </p>
                  </div>
                  <span className="text-[0.65rem] text-neutral-500">
                    ID: {f.fixtureId}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedFixtureId && (
          <p className="text-xs text-emerald-400 mt-1">
            Selected fixture ID: {selectedFixtureId}
          </p>
        )}
      </div>

      {/* Under the hood form (mostly auto-filled from the picker) */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 my-4">
          {/* hidden eventId field */}
          <input type="hidden" {...form.register("eventId")} />

          {/* Home team (shows what was picked, but readonly to avoid mistakes) */}
          <FormField
            name="homeTeam"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Home team</FormLabel>
                <FormControl>
                  <Input {...field} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Away team */}
          <FormField
            name="awayTeam"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Away team</FormLabel>
                <FormControl>
                  <Input {...field} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Kickoff (can be adjusted manually if needed) */}
          <FormField
            name="kickoffAt"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Kickoff time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* External fixture ID (read-only, from football-data) */}
          <FormField
            name="externalFixtureId"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>External fixture ID</FormLabel>
                <FormControl>
                  <Input {...field} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      {error && <FormError message={error} />}
    </Modal>
  );
}

/* ---------------------------
   Helpers (date-fns based)
---------------------------- */

function toISOFromLocal(datetimeLocal?: string): string | undefined {
  if (!datetimeLocal) return undefined;
  const parsed = parse(datetimeLocal, "yyyy-MM-dd'T'HH:mm", new Date());
  if (!isValid(parsed)) return undefined;
  return formatISO(parsed);
}

function toLocalDateTime(iso: string) {
  const d = parseISO(iso);
  if (!isValid(d)) return "";
  return format(d, "yyyy-MM-dd'T'HH:mm");
}
