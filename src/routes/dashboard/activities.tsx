import { createFileRoute } from '@tanstack/react-router'
import { ActivitiesPage } from '@/components/dashboard/activities/ActivitiesPage'

export const Route = createFileRoute('/dashboard/activities')({
  component: ActivitiesPage,
})
