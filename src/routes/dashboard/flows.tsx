import { createFileRoute } from '@tanstack/react-router'
import { FlowsPage } from '@/components/dashboard/flows/FlowsPage'

export const Route = createFileRoute('/dashboard/flows')({
  component: FlowsPage,
})
