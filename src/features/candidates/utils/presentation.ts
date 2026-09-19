const labels: Record<string, string> = {
  'En attente': 'New application',
  'Entretien RH': 'HR interview',
  'Entretien technique': 'Technical interview',
  Accepté: 'Hired',
  Refusé: 'Rejected',
  'Développeur Vue.js': 'Vue.js Developer',
  'Développeur Frontend': 'Frontend Developer',
  'Développeur Full Stack': 'Full Stack Developer',
  'Développeur Backend': 'Backend Developer',
  Immédiate: 'Immediately',
  '1 mois': '1 month',
  '2 mois': '2 months',
  '2 semaines': '2 weeks',
  '3 semaines': '3 weeks',
}
export const label = (value: string) => labels[value] || value
export const experienceLabel = (value: string) =>
  value.replace(/ans?\b/, 'years').replace('mois', 'months')
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value),
  )
export const currency = (value: number) =>
  new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
export function safeWebUrl(value: string): string | undefined {
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined
  } catch {
    return undefined
  }
}
