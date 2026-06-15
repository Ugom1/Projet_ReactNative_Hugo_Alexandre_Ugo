import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
});

export const signupSchema = z
  .object({
    pseudo: z.string().min(2, 'Pseudo trop court').max(30, 'Pseudo trop long'),
    email: z.string().email('Adresse email invalide'),
    password: z.string().min(6, 'Minimum 6 caractères'),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { message: 'Vous devez accepter les conditions' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide'),
});

export const profileUpdateSchema = z.object({
  pseudo: z.string().min(2, 'Pseudo trop court').max(30, 'Pseudo trop long'),
});

export const userProfileSchema = z.object({
  uid: z.string(),
  email: z.string(),
  pseudo: z.string(),
  monnaie: z.number(),
  niveau: z.number(),
  gainParClic: z.number(),
  upgradeCost: z.number().optional(),
  totalClics: z.number(),
  palierActuel: z.number(),
  autoClickPerSec: z.number().optional(),
  photoURL: z.string().url().optional(),
});

export const playerCardSchema = z.object({
  id: z.string(),
  nom: z.string(),
  position: z.enum(['ATT', 'MDC', 'DC', 'GB']),
  ligue: z.enum(['Ligue 1', 'Premier League', 'Liga', 'Serie A']),
  nationalite: z.string(),
  note: z.number(),
  rarete: z.enum(['UNCOMMON', 'RARE', 'SUPER_RARE', 'UNIQUE']),
  image: z.string(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
