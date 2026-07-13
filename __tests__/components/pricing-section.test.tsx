/**
 * @jest-environment jsdom
 *
 * Tests for src/components/pricing-section.tsx
 * Covers: billing period toggle (aria-pressed), headingLevel prop (h1/h2),
 * default tag/heading rendering, and interactive state transitions.
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { PricingSection } from '@/components/pricing-section'

// Mock useReducedMotion so both branches of the prefersReducedMotion ternary
// (price motion.div / total motion.p) can be exercised deterministically.
// Pattern mirrors __tests__/components/pricing/comparison-table.test.tsx.
let mockReducedMotion = false
jest.mock('@/hooks/use-reduced-motion', () => ({
  useReducedMotion: () => mockReducedMotion,
}))

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

describe('PricingSection', () => {
  beforeEach(() => {
    mockReducedMotion = false
  })

  describe('default rendering', () => {
    it('renders the pricing title', () => {
      render(<PricingSection />)
      expect(screen.getByText('Planos e Preços')).toBeInTheDocument()
    })

    it('renders as <section> by default', () => {
      const { container } = render(<PricingSection />)
      expect(container.querySelector('section')).not.toBeNull()
    })

    it('renders as <div> when as="div"', () => {
      const { container } = render(<PricingSection as="div" />)
      expect(container.querySelector('div')).not.toBeNull()
      expect(container.querySelector('section')).toBeNull()
    })

    it('renders heading as h2 by default', () => {
      const { container } = render(<PricingSection />)
      expect(container.querySelector('h2')).not.toBeNull()
      expect(container.querySelector('h1')).toBeNull()
    })

    it('renders heading as h1 when headingLevel="h1"', () => {
      const { container } = render(<PricingSection headingLevel="h1" />)
      expect(container.querySelector('h1')).not.toBeNull()
      expect(container.querySelector('h2')).toBeNull()
    })

    it('applies id prop to root element', () => {
      const { container } = render(<PricingSection id="pricing" />)
      const root = container.firstChild as HTMLElement
      expect(root.id).toBe('pricing')
    })

    it('applies className prop', () => {
      const { container } = render(<PricingSection className="custom-class" />)
      const root = container.firstChild as HTMLElement
      expect(root.className).toContain('custom-class')
    })
  })

  describe('billing period — role="radiogroup" + aria-checked', () => {
    it('renders radiogroup with 3 radio buttons', () => {
      render(<PricingSection />)
      const radiogroup = screen.getByRole('radiogroup')
      expect(radiogroup).toBeInTheDocument()
      const radios = screen.getAllByRole('radio')
      expect(radios).toHaveLength(3)
    })

    it('monthly radio has aria-checked="true" on initial render', () => {
      render(<PricingSection />)
      const radios = screen.getAllByRole('radio')
      const monthlyRadio = radios.find((r) => r.textContent?.includes('Mensal'))
      expect(monthlyRadio).toHaveAttribute('aria-checked', 'true')
    })

    it('semester radio has aria-checked="false" on initial render', () => {
      render(<PricingSection />)
      const radios = screen.getAllByRole('radio')
      const semesterRadio = radios.find((r) => r.textContent?.includes('Semestral'))
      expect(semesterRadio).toHaveAttribute('aria-checked', 'false')
    })

    it('annual radio has aria-checked="false" on initial render', () => {
      render(<PricingSection />)
      const radios = screen.getAllByRole('radio')
      const annualRadio = radios.find((r) => r.textContent?.includes('Anual'))
      expect(annualRadio).toHaveAttribute('aria-checked', 'false')
    })

    it('all radios have type="button"', () => {
      render(<PricingSection />)
      const radios = screen.getAllByRole('radio')
      radios.forEach((radio) => {
        expect(radio).toHaveAttribute('type', 'button')
      })
    })

    it('clicking semester sets aria-checked correctly', () => {
      render(<PricingSection />)
      const radios = screen.getAllByRole('radio')
      const semesterRadio = radios.find((r) => r.textContent?.includes('Semestral'))!
      fireEvent.click(semesterRadio)

      expect(semesterRadio).toHaveAttribute('aria-checked', 'true')

      const monthlyRadio = radios.find((r) => r.textContent?.includes('Mensal'))!
      expect(monthlyRadio).toHaveAttribute('aria-checked', 'false')
    })

    it('clicking annual sets aria-checked correctly', () => {
      render(<PricingSection />)
      const radios = screen.getAllByRole('radio')
      const annualRadio = radios.find((r) => r.textContent?.includes('Anual'))!
      fireEvent.click(annualRadio)

      expect(annualRadio).toHaveAttribute('aria-checked', 'true')

      const monthlyRadio = radios.find((r) => r.textContent?.includes('Mensal'))!
      expect(monthlyRadio).toHaveAttribute('aria-checked', 'false')
    })

    it('toggling back to monthly restores aria-checked', () => {
      render(<PricingSection />)
      const radios = screen.getAllByRole('radio')
      const semesterRadio = radios.find((r) => r.textContent?.includes('Semestral'))!
      const monthlyRadio = radios.find((r) => r.textContent?.includes('Mensal'))!

      fireEvent.click(semesterRadio)
      expect(semesterRadio).toHaveAttribute('aria-checked', 'true')

      fireEvent.click(monthlyRadio)
      expect(monthlyRadio).toHaveAttribute('aria-checked', 'true')
      expect(semesterRadio).toHaveAttribute('aria-checked', 'false')
    })
  })

  describe('price display', () => {
    it('shows monthly price by default', () => {
      render(<PricingSection />)
      // Price is rendered as "R$ 29,90" in a single span — use regex to match partial
      expect(screen.getByText(/29,90/)).toBeInTheDocument()
    })

    it('shows semester price after clicking semestral', () => {
      render(<PricingSection />)
      fireEvent.click(screen.getByRole('radio', { name: 'Semestral' }))
      expect(screen.getByText(/24,90/)).toBeInTheDocument()
    })

    it('shows annual price after clicking anual', () => {
      render(<PricingSection />)
      const radios = screen.getAllByRole('radio')
      const annualRadio = radios.find((r) => r.textContent?.includes('Anual'))!
      fireEvent.click(annualRadio)
      expect(screen.getByText(/20,90/)).toBeInTheDocument()
    })

    it('shows billing total when period is not monthly', () => {
      render(<PricingSection />)
      fireEvent.click(screen.getByRole('radio', { name: 'Semestral' }))
      expect(screen.getByText('Total: R$ 149,40')).toBeInTheDocument()
    })

    it('does not show billing total when period is monthly', () => {
      render(<PricingSection />)
      expect(screen.queryByText(/Total:/)).not.toBeInTheDocument()
    })
  })

  describe('reduced motion — prefersReducedMotion branches on price elements', () => {
    it('price motion.div still renders the price when reduced motion is off (default)', () => {
      // mockReducedMotion = false via beforeEach — exercises the `{ initial, animate, exit, transition }` branch
      render(<PricingSection />)
      expect(screen.getByText(/29,90/)).toBeInTheDocument()
    })

    it('price motion.div still renders the price when reduced motion is on', () => {
      mockReducedMotion = true
      // exercises the `{}` (no motion props) branch of the price motion.div ternary
      render(<PricingSection />)
      expect(screen.getByText(/29,90/)).toBeInTheDocument()
    })

    it('total motion.p still renders the total when reduced motion is off and period is not monthly', () => {
      // mockReducedMotion = false via beforeEach — exercises the `{ initial, animate, exit, transition }` branch
      render(<PricingSection />)
      fireEvent.click(screen.getByRole('radio', { name: 'Semestral' }))
      expect(screen.getByText('Total: R$ 149,40')).toBeInTheDocument()
    })

    it('total motion.p still renders the total when reduced motion is on and period is not monthly', () => {
      mockReducedMotion = true
      // exercises the `{}` (no motion props) branch of the total motion.p ternary
      render(<PricingSection />)
      fireEvent.click(screen.getByRole('radio', { name: 'Semestral' }))
      expect(screen.getByText('Total: R$ 149,40')).toBeInTheDocument()
    })
  })

  describe('plan cards — all 3 plans rendered', () => {
    it('renders Free plan', () => {
      render(<PricingSection />)
      expect(screen.getByText('Free')).toBeInTheDocument()
    })

    it('renders Pro plan', () => {
      render(<PricingSection />)
      expect(screen.getByText('Pro')).toBeInTheDocument()
    })

    it('renders Enterprise plan', () => {
      render(<PricingSection />)
      expect(screen.getByText('Enterprise')).toBeInTheDocument()
    })
  })

  // PRO_CHECKOUT_ENABLED is `false` in src/lib/constants.ts (real, unmocked value here),
  // so this suite exercises the "coming soon" branch that ships to production today.
  // The PRO_CHECKOUT_ENABLED === true branch is covered separately in
  // pricing-section-pro-enabled.test.tsx, which mocks the constants module.
  describe('Pro CTA — coming soon state (PRO_CHECKOUT_ENABLED=false)', () => {
    it('renders the "Em breve" badge next to the Pro plan name', () => {
      render(<PricingSection />)
      const proHeading = screen.getByText('Pro')
      const badge = proHeading.parentElement?.querySelector('[data-slot="badge"]')
      expect(badge).not.toBeNull()
      expect(badge).toHaveTextContent('Em breve')
    })

    it('renders the coming-soon CTA button with aria-disabled="true"', () => {
      render(<PricingSection />)
      const ctaButton = screen.getByRole('button', { name: 'Em breve' })
      expect(ctaButton).toHaveAttribute('aria-disabled', 'true')
    })

    it('coming-soon CTA button has aria-describedby pointing to the note id', () => {
      render(<PricingSection />)
      const ctaButton = screen.getByRole('button', { name: 'Em breve' })
      expect(ctaButton).toHaveAttribute('aria-describedby', 'pro-coming-soon-note')
    })

    it('renders the coming-soon note with the exact id referenced by aria-describedby', () => {
      const { container } = render(<PricingSection />)
      const note = container.querySelector('#pro-coming-soon-note')
      expect(note).not.toBeNull()
      expect(note?.tagName).toBe('P')
      expect(note).toHaveTextContent('Estamos finalizando os pagamentos.')
    })

    it('coming-soon CTA button renders the Clock icon', () => {
      render(<PricingSection />)
      const ctaButton = screen.getByRole('button', { name: 'Em breve' })
      expect(ctaButton.querySelector('svg')).not.toBeNull()
    })

    it('does NOT render the clickable "Assinar Pro" subscribe button', () => {
      render(<PricingSection />)
      expect(screen.queryByText('Assinar Pro')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Assinar Pro' })).not.toBeInTheDocument()
    })

    it('coming-soon CTA button is a plain <button>, not the Button component (no data-slot)', () => {
      render(<PricingSection />)
      const ctaButton = screen.getByRole('button', { name: 'Em breve' })
      // The Button component always renders data-slot="button" (see src/components/button.tsx).
      // The coming-soon CTA is a raw <button>, so this attribute must be absent.
      expect(ctaButton).not.toHaveAttribute('data-slot')
      expect(ctaButton.className).not.toContain('hover:bg-teal-800')
    })

    it('exactly two elements render the "Em breve" copy (badge + CTA label)', () => {
      render(<PricingSection />)
      expect(screen.getAllByText('Em breve')).toHaveLength(2)
    })
  })
})
