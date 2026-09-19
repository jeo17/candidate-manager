import { z } from 'zod'
import type { CandidateInput } from '../types'

const optionalText = (maximum: number) => z.string().trim().max(maximum)

export const candidateSchema: z.ZodType<CandidateInput> = z.object({
  nom: z
    .string()
    .trim()
    .min(2, 'Enter at least 2 characters.')
    .max(120, 'Keep the name under 120 characters.')
    .regex(/\p{L}/u, 'Enter a name containing letters.'),
  email: z
    .string()
    .trim()
    .min(1, 'Enter an email address.')
    .max(200, 'Keep the email under 200 characters.')
    .email('Enter a valid email address.'),
  telephone: optionalText(40)
    .refine(
      (value) => !value || /^[+]?[-\d\s().]+$/.test(value),
      'Use only digits and common phone symbols.',
    )
    .refine((value) => {
      if (!value) return true
      const digitCount = value.replace(/\D/g, '').length
      return digitCount >= 7 && digitCount <= 15
    }, 'Enter a phone number with 7 to 15 digits.'),
  poste: z.string().trim().min(1, 'Select a position.'),
  statut: z.string().trim().min(1, 'Select a hiring stage.'),
  competences: z
    .array(z.string().trim().min(1).max(50, 'Keep each skill under 50 characters.'))
    .max(20, 'Add no more than 20 skills.'),
  experience: optionalText(50).refine(
    (value) => !value || /\d/.test(value),
    'Include a number, for example “3 years”.',
  ),
  dateCandidature: z
    .string()
    .min(1, 'Select an application date.')
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Select a valid application date.')
    .refine(
      (value) => !value || Date.parse(value) <= Date.now(),
      'The application date cannot be in the future.',
    ),
  cv: optionalText(2000).refine((value) => {
    if (!value) return true
    try {
      return ['http:', 'https:'].includes(new URL(value).protocol)
    } catch {
      return false
    }
  }, 'Enter a valid http or https URL.'),
  lettreMotivation: optionalText(10000),
  salaireSouhaite: z
    .number({ error: 'Enter a valid salary.' })
    .finite('Enter a valid salary.')
    .int('Enter a whole number.')
    .min(0, 'Salary cannot be negative.')
    .max(10_000_000, 'Salary cannot exceed €10,000,000.'),
  disponibilite: optionalText(100),
  localisation: optionalText(120).refine(
    (value) => !value || /\p{L}/u.test(value),
    'Enter a location containing letters.',
  ),
  commentaires: z.array(
    z.object({
      id: z.number(),
      auteur: z.string(),
      date: z.string(),
      contenu: z.string(),
    }),
  ),
})

export type CandidateValidationErrors = Partial<Record<keyof CandidateInput, string>>

export function validateCandidate(input: CandidateInput) {
  const result = candidateSchema.safeParse(input)
  if (result.success) return { success: true as const, data: result.data }

  const errors: CandidateValidationErrors = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof CandidateInput | undefined
    if (field && !errors[field]) errors[field] = issue.message
  }
  return { success: false as const, errors }
}
