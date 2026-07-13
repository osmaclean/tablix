export const SITE_URL = 'https://tablix.me'
export const CONTACT_EMAIL = 'contact@tablix.me'
export const LEGAL_LAST_UPDATED = '2026-03-30'

/**
 * Toggle do checkout do plano Pro. Enquanto `false`, o CTA do Pro renderiza o
 * estado "Em breve" (badge + botão aria-disabled + nota) em vez do botão de
 * assinatura. Virar para `true` quando o checkout do backend estiver no ar —
 * reativa o `<Button variant="brand">` com o fluxo de assinatura sem mexer em
 * layout nem i18n.
 */
export const PRO_CHECKOUT_ENABLED = false

/**
 * Last meaningful content/structure change of the marketing pages (home, pricing).
 * Used as a stable `lastmod` in the sitemap — bump manually on relevant changes.
 * Avoids `new Date()` which would mark every page as "changed" on every build,
 * teaching Google to ignore our lastmod signal.
 */
export const SITE_LAST_UPDATED = '2026-06-21'
