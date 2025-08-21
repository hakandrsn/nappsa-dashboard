import { Outlet, createRootRoute } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/query-client'
import { LanguageProvider } from '@/contexts/LanguageContext'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <div className="min-h-screen bg-background">
          <Outlet />
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </LanguageProvider>
    </QueryClientProvider>
  )
}
