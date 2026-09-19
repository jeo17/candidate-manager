import { describe, expect, it } from 'vitest'
import type { CandidateInput } from '../types'
import { validateCandidate } from './candidateSchema'

const validCandidate: CandidateInput = {
  nom: 'Alex Morgan',
  email: 'alex@example.com',
  telephone: '+33 6 12 34 56 78',
  poste: 'Développeur Vue.js',
  statut: 'En attente',
  competences: ['Vue.js', 'TypeScript'],
  experience: '3 years',
  dateCandidature: '2024-01-10T12:00:00.000Z',
  cv: 'https://example.com/alex.pdf',
  lettreMotivation: '',
  salaireSouhaite: 50_000,
  disponibilite: 'Immediately',
  localisation: 'Paris, France',
  commentaires: [],
}

describe('candidate validation', () => {
  it('accepts a realistic candidate', () => {
    expect(validateCandidate(validCandidate).success).toBe(true)
  })

  it('returns field-specific errors for malformed input', () => {
    const result = validateCandidate({
      ...validCandidate,
      nom: '1234',
      email: 'not-an-email',
      telephone: 'abc',
      experience: 'many',
      dateCandidature: '2999-01-01T12:00:00.000Z',
      cv: 'javascript:alert(1)',
      salaireSouhaite: -10,
      localisation: '12345',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors).toMatchObject({
        nom: expect.any(String),
        email: expect.any(String),
        telephone: expect.any(String),
        experience: expect.any(String),
        dateCandidature: expect.any(String),
        cv: expect.any(String),
        salaireSouhaite: expect.any(String),
        localisation: expect.any(String),
      })
    }
  })
})
