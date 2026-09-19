export interface CandidateComment {
  id: number
  auteur: string
  date: string
  contenu: string
}
export interface Candidate {
  id: number
  nom: string
  poste: string
  statut: string
  competences: string[]
  experience: string
  dateCandidature: string
  email: string
  telephone: string
  cv: string
  lettreMotivation: string
  salaireSouhaite: number
  disponibilite: string
  localisation: string
  commentaires: CandidateComment[]
}
export type CandidateInput = Omit<Candidate, 'id'>
export interface CandidateStatus {
  id: number
  nom: string
  couleur: string
  ordre: number
}
export interface Position {
  id: number
  titre: string
  description: string
  competencesRequises: string[]
}
export interface Skill {
  id: number
  nom: string
  categorie: string
}
export interface CandidateFilters {
  search: string
  status: string
  position: string
  skill: string
  from: string
  to: string
  experience: string
  sort: 'newest' | 'oldest' | 'name'
}
export const emptyFilters = (): CandidateFilters => ({
  search: '',
  status: '',
  position: '',
  skill: '',
  from: '',
  to: '',
  experience: '',
  sort: 'newest',
})
