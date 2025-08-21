import { createFileRoute } from '@tanstack/react-router'
import { FoodsPage } from '@/components/dashboard/foods/FoodsPage'

export const Route = createFileRoute('/dashboard/foods')({
  component: FoodsPage,
})
