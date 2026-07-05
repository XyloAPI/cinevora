import { lazy, Suspense, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Routes, Route, Outlet } from 'react-router-dom'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { Toaster } from 'sonner'
import { ReactLenis } from 'lenis/react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { HeroSkeleton } from '@/components/shared/Skeleton'

const HomePage = lazy(() => import('@/pages/HomePage'))
const TrendingPage = lazy(() => import('@/pages/TrendingPage'))
const MoviesPage = lazy(() => import('@/pages/MoviesPage'))
const SeriesPage = lazy(() => import('@/pages/SeriesPage'))
const GenresPage = lazy(() => import('@/pages/GenresPage'))
const MovieDetailPage = lazy(() => import('@/pages/MovieDetailPage'))
const WatchPage = lazy(() => import('@/pages/WatchPage'))
const TrailerPage = lazy(() => import('@/pages/TrailerPage'))
const AdminPanel = lazy(() => import('@/pages/AdminPanel'))
const FAQPage = lazy(() => import('@/pages/FAQPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'))
const TermsPage = lazy(() => import('@/pages/TermsPage'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function PageFallback() {
  return (
    <div className="pt-14">
      <HeroSkeleton />
    </div>
  )
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center pt-14">
      <div className="text-center max-w-md px-4">
        <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
        <p className="text-sm text-white/50 mb-4">{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
        <button onClick={resetErrorBoundary} className="px-4 py-2 bg-cinema-red text-white text-sm rounded hover:bg-cinema-red-dark transition-colors">
          Try again
        </button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ReactLenis root>
      <div className="min-h-screen bg-cinema-950 text-white">
        <ScrollToTop />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: '#1a1a2e', color: '#fff', border: '1px solid rgba(255,255,255,0.06)' },
          }}
        />
        <Routes>
          <Route path="/watch/:slug" element={
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Suspense fallback={<PageFallback />}>
                <WatchPage />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="/trailer/:slug" element={
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Suspense fallback={<PageFallback />}>
                <TrailerPage />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="/buahlilguanteng" element={
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Suspense fallback={<PageFallback />}>
                <AdminPanel />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route element={
            <>
              <Navbar />
              <main>
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <Suspense fallback={<PageFallback />}>
                    <Outlet />
                  </Suspense>
                </ErrorBoundary>
              </main>
              <Footer />
            </>
          }>
            <Route path="/" element={<HomePage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/series" element={<SeriesPage />} />
            <Route path="/genres" element={<GenresPage />} />
            <Route path="/movie/:slug" element={<MovieDetailPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<HomePage />} />
          </Route>
        </Routes>
      </div>
    </ReactLenis>
  )
}
