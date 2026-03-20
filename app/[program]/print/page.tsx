import { ClientOnly } from '@/components/ClientOnly'
import { PlanPrintView } from '@/components/PlanPrintView'

export default function PrintPage() {
  return (
    <ClientOnly>
      <PlanPrintView />
    </ClientOnly>
  )
}
