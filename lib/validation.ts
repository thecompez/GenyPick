import { z } from "zod";
import { CARD_PRICE_GENY } from "@/lib/contracts";
import { WORLD_CUP_2026_TEAMS } from "@/lib/teams";

const validTeamIds = new Set(WORLD_CUP_2026_TEAMS.map((team) => team.id));
const predictionFields = {
  champion: z.number().int(),
  runnerUp: z.number().int(),
  thirdPlace: z.number().int(),
  fourthPlace: z.number().int()
};

function refinePrediction<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((prediction, ctx) => {
    const ids = [
      prediction.champion,
      prediction.runnerUp,
      prediction.thirdPlace,
      prediction.fourthPlace
    ];
    ids.forEach((id, index) => {
      if (!validTeamIds.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [["champion", "runnerUp", "thirdPlace", "fourthPlace"][index]],
          message: "Invalid team"
        });
      }
    });
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Teams must be unique"
      });
    }
  });
}

export const predictionSchema = refinePrediction(z.object(predictionFields));

export const indexedPredictionSchema = refinePrediction(z.object({
  ...predictionFields,
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  fid: z.number().int().positive().optional().nullable(),
  username: z.string().max(64).optional().nullable(),
  displayName: z.string().max(120).optional().nullable(),
  pfpUrl: z.string().url().optional().nullable(),
  entryAmount: z.coerce.number().refine((amount) => amount === CARD_PRICE_GENY, {
    message: "Card price is exactly 256 GENY"
  }),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/)
}));

export const adminFinalResultSchema = refinePrediction(z.object({
  ...predictionFields,
  adminSecret: z.string().min(16),
  force: z.boolean().optional()
}));

export function validateEntryAmount(value: string): { ok: true; amount: number } | { ok: false; error: string } {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return { ok: false, error: "Enter a valid GENY amount" };
  if (amount !== CARD_PRICE_GENY) return { ok: false, error: "Card price is exactly 256 GENY" };
  return { ok: true, amount };
}

export function validateDeadline(deadlineSeconds?: number): boolean {
  if (!deadlineSeconds) return true;
  return Date.now() < deadlineSeconds * 1000;
}
