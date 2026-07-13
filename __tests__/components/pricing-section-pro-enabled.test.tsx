/**
 * @jest-environment jsdom
 *
 * Tests for src/components/pricing-section.tsx — PRO_CHECKOUT_ENABLED === true branch.
 *
 * Split into its own file (instead of a describe block in pricing-section.test.tsx)
 * because `PRO_CHECKOUT_ENABLED` is a module-level const imported directly by the
 * component. jest.mock() is hoisted and applies to the whole file, so toggling the
 * flag between "true" and "false" scenarios requires two separate test files rather
 * than jest.resetModules()/jest.doMock() gymnastics inside a single suite.
 *
 * Once the backend checkout ships and PRO_CHECKOUT_ENABLED flips to `true` in
 * production, this file documents/guards the "old" clickable subscribe behavior
 * that pricing-section.test.tsx no longer exercises by default.
 */
import { render, screen } from '@testing-library/react'
import { PricingSection } from '@/components/pricing-section'

// Mock framer-motion to avoid animation side-effects in jsdom
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...rest}>{children}</div>
    ),
    p: ({ children, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p {...rest}>{children}</p>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock useLocale with real-looking translation keys
jest.mock('@/lib/i18n', () => ({
  useLocale: () => ({
    locale: 'pt-BR',
    t: (key: string, _params?: Record<string, string>) => {
      const map: Record<string, string> = {
        'pricing.title': 'Planos e Preços',
        'pricing.subtitle': 'Escolha o plano ideal',
        'pricing.billingPeriod.monthly': 'Mensal',
        'pricing.billingPeriod.semester': 'Semestral',
        'pricing.billingPeriod.annual': 'Anual',
        'pricing.billingPeriod.annualBadge': '-30%',
        'pricing.plans.free.name': 'Free',
        'pricing.plans.free.price': 'R$ 0',
        'pricing.plans.free.period': 'para sempre',
        'pricing.plans.free.features.sheetsPerMonth': '3 planilhas/mês',
        'pricing.plans.free.features.maxRows': 'Até 500 linhas',
        'pricing.plans.free.features.maxColumns': 'Até 20 colunas',
        'pricing.plans.free.description': 'Plano gratuito',
        'pricing.plans.free.cta': 'Começar grátis',
        'pricing.plans.pro.name': 'Pro',
        'pricing.plans.pro.badge': 'Mais popular',
        'pricing.plans.pro.oldPrice': 'R$ 49,90',
        'pricing.plans.pro.period': 'mês',
        'pricing.plans.pro.launchPrice': 'Preço de lançamento',
        'pricing.plans.pro.features.sheetsPerMonth': 'Planilhas ilimitadas',
        'pricing.plans.pro.features.maxRows': 'Até 50.000 linhas',
        'pricing.plans.pro.features.maxColumns': 'Até 200 colunas',
        'pricing.plans.pro.features.priorityProcessing': 'Processamento prioritário',
        'pricing.plans.pro.features.noWatermark': "Sem marca d'água",
        'pricing.plans.pro.features.fileHistory': 'Histórico de arquivos',
        'pricing.plans.pro.cta': 'Assinar Pro',
        'pricing.plans.pro.comingSoonBadge': 'Em breve',
        'pricing.plans.pro.ctaComingSoon': 'Em breve',
        'pricing.plans.pro.comingSoonNote': 'Estamos finalizando os pagamentos.',
        'pricing.plans.enterprise.name': 'Enterprise',
        'pricing.plans.enterprise.price': 'Sob consulta',
        'pricing.plans.enterprise.period': 'contrato personalizado',
        'pricing.plans.enterprise.features.customLimits': 'Limites personalizados',
        'pricing.plans.enterprise.features.sla': 'SLA garantido',
        'pricing.plans.enterprise.features.prioritySupport': 'Suporte prioritário',
        'pricing.plans.enterprise.features.dedicatedInfra': 'Infra dedicada',
        'pricing.plans.enterprise.description': 'Para grandes times',
        'pricing.plans.enterprise.cta': 'Falar com vendas',
        'billingPeriods.month': 'mês',
        'proPricing.currencySymbol': 'R$',
        'proPricing.monthly.price': '29,90',
        'proPricing.monthly.total': '',
        'proPricing.semester.price': '24,90',
        'proPricing.semester.total': 'Total: R$ 149,40',
        'proPricing.annual.price': '20,90',
        'proPricing.annual.total': 'Total: R$ 250,80',
      }
      return map[key] ?? key
    },
  }),
  useLocalizedHref: () => (path: string) => path,
}))

// Mock next/link
jest.mock('next/link', () => {
  const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  )
  Link.displayName = 'Link'
  return Link
})

// Force the checkout-enabled branch, regardless of the real value in
// src/lib/constants.ts. Only override what pricing-section.tsx actually imports
// from this module (CONTACT_EMAIL, PRO_CHECKOUT_ENABLED).
jest.mock('@/lib/constants', () => ({
  CONTACT_EMAIL: 'contact@tablix.me',
  PRO_CHECKOUT_ENABLED: true,
}))

describe('PricingSection — Pro CTA — checkout enabled state (PRO_CHECKOUT_ENABLED=true)', () => {
  it('renders the clickable "Assinar Pro" subscribe button', () => {
    render(<PricingSection />)
    const ctaButton = screen.getByRole('button', { name: 'Assinar Pro' })
    expect(ctaButton).toBeInTheDocument()
  })

  it('subscribe button is the Button component (data-slot="button") and not aria-disabled', () => {
    render(<PricingSection />)
    const ctaButton = screen.getByRole('button', { name: 'Assinar Pro' })
    expect(ctaButton).toHaveAttribute('data-slot', 'button')
    expect(ctaButton).not.toHaveAttribute('aria-disabled')
  })

  it('does NOT render the "Em breve" badge next to the Pro plan name', () => {
    render(<PricingSection />)
    const proHeading = screen.getByText('Pro')
    const badge = proHeading.parentElement?.querySelector('[data-slot="badge"]')
    expect(badge).toBeNull()
  })

  it('does NOT render the coming-soon note or its id', () => {
    const { container } = render(<PricingSection />)
    expect(container.querySelector('#pro-coming-soon-note')).toBeNull()
    expect(screen.queryByText('Estamos finalizando os pagamentos.')).not.toBeInTheDocument()
  })

  it('does NOT render any "Em breve" copy at all', () => {
    render(<PricingSection />)
    expect(screen.queryByText('Em breve')).not.toBeInTheDocument()
  })
})
