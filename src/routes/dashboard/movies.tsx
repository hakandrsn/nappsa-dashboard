import { createFileRoute } from '@tanstack/react-router'
import { MoviesPage } from '@/components/dashboard/movies/MoviesPage'

export const Route = createFileRoute('/dashboard/movies')({
  component: MoviesPage,
})
