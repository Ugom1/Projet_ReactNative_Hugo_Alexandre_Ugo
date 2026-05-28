import { z } from 'zod';
import { FORMATIONS } from './constants';

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
});

export const signupSchema = loginSchema.extend({
  displayName: z.string().min(2, 'Nom trop court').max(40),
});

export const profileSchema = z.object({
  displayName: z.string().min(2).max(40),
});

export const teamSchema = z.object({
  name: z.string().min(2, 'Nom requis').max(30),
  formation: z.enum(FORMATIONS),
  leagueId: z.number(),
});

export const playerSlotSchema = z.object({
  apiPlayerId: z.number(),
  name: z.string(),
  position: z.string(),
  rating: z.number(),
  photo: z.string().optional(),
  slotId: z.string(),
  price: z.number(),
});

export const dreamTeamSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  name: z.string(),
  formation: z.enum(FORMATIONS),
  leagueId: z.number(),
  leagueName: z.string().optional(),
  players: z.array(playerSlotSchema),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type DreamTeam = z.infer<typeof dreamTeamSchema>;
export type PlayerSlot = z.infer<typeof playerSlotSchema>;

export const userProfileSchema = z.object({
  uid: z.string(),
  email: z.string(),
  displayName: z.string(),
  photoURL: z.string().optional(),
  coins: z.number(),
  xp: z.number(),
  totalClicks: z.number(),
  clickPower: z.number(),
  activeBoosts: z.array(
    z.object({
      id: z.string(),
      multiplier: z.number(),
      expiresAt: z.number(),
      auto: z.boolean().optional(),
    })
  ),
  achievements: z.array(z.string()),
  disabled: z.boolean().optional(),
  createdAt: z.any().optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
