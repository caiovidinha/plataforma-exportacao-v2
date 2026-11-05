import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { StorePage } from '@/components/layout/StorePage'

export const metadata = { title: 'Cadastro' }
export default function Page() {
  return (
    <StorePage>
      <OnboardingWizard />
    </StorePage>
  )
}
