import { lazy, Suspense, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Routes, Route, Outlet } from 'react-router-dom'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { Toaster } from 'sonner'
import { ReactLenis } from 'lenis/react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { HeroSkeleton } from '@/components/shared/Skeleton'

function lazyWithRetry(importFunc: () => Promise<any>) {
  return lazy(async () => {
    try {
      return await importFunc()
    } catch (error) {
      const lastReload = sessionStorage.getItem('chunk_reload_time')
      const now = Date.now()
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem('chunk_reload_time', String(now))
        window.location.reload()
        return { default: () => null }
      }
      throw error
    }
  })
}

const HomePage = lazyWithRetry(() => import('@/pages/HomePage'))
const TrendingPage = lazyWithRetry(() => import('@/pages/TrendingPage'))
const MoviesPage = lazyWithRetry(() => import('@/pages/MoviesPage'))
const SeriesPage = lazyWithRetry(() => import('@/pages/SeriesPage'))
const GenresPage = lazyWithRetry(() => import('@/pages/GenresPage'))
const MovieDetailPage = lazyWithRetry(() => import('@/pages/MovieDetailPage'))
const WatchPage = lazyWithRetry(() => import('@/pages/WatchPage'))
const TrailerPage = lazyWithRetry(() => import('@/pages/TrailerPage'))
const AdminPanel = lazyWithRetry(() => import('@/pages/AdminPanel'))
const FAQPage = lazyWithRetry(() => import('@/pages/FAQPage'))
const ContactPage = lazyWithRetry(() => import('@/pages/ContactPage'))
const PrivacyPage = lazyWithRetry(() => import('@/pages/PrivacyPage'))
const TermsPage = lazyWithRetry(() => import('@/pages/TermsPage'))

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
  const isChunkError = error instanceof Error && (
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('dynamically imported module') ||
    error.message.includes('Loading chunk')
  )

  useEffect(() => {
    if (isChunkError) {
      const lastReload = sessionStorage.getItem('chunk_reload_time')
      const now = Date.now()
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem('chunk_reload_time', String(now))
        window.location.reload()
      }
    }
  }, [isChunkError])

  return (
    <div className="min-h-screen flex items-center justify-center pt-14 bg-cinema-950 text-white">
      <div className="text-center max-w-md px-4">
        <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
        <p className="text-sm text-white/50 mb-4 text-pretty">
          {isChunkError ? 'Memperbarui aplikasi ke versi terbaru...' : (error instanceof Error ? error.message : 'An unexpected error occurred')}
        </p>
        <button
          onClick={() => {
            sessionStorage.removeItem('chunk_reload_time')
            resetErrorBoundary()
            window.location.reload()
          }}
          className="px-4 py-2 bg-cinema-red text-white text-sm rounded hover:bg-cinema-red-dark transition-colors"
        >
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
