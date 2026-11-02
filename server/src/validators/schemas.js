import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/, "letters, numbers, underscore only"),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const requestQuestionSchema = z.object({
  difficulty: z.number().int().min(1).max(6).optional(),
  monsterId: z.string().optional(),
  sessionId: z.string().optional(),
  roomCode: z.string().min(1).max(8).optional(),
  monsterInstanceId: z.string().min(1).max(32).optional(),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1),
  answer: z.union([z.string(), z.number()]),
});

export const createRoomSchema = z.object({
  dungeonId: z.string().min(1),
  isPrivate: z.boolean().optional().default(false),
  soloMode: z.boolean().optional().default(false),
});

export const useItemSchema = z.object({
  itemKey: z.string().min(1),
});

export const leaderboardQuerySchema = z.object({
  by: z.enum(["level", "xp", "monsters", "accuracy"]).optional().default("level"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
