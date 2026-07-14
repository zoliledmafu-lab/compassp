export const AUTH_PAGE_BG =
  'radial-gradient(ellipse at 30% 20%, rgba(79,70,229,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(124,58,237,0.1) 0%, transparent 60%), #0f0f1a'

export function capitalizeName(name: string | null | undefined): string {
  if (!name) return ''
  return name
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
