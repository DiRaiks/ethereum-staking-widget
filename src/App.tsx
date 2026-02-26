/**
 * Корневой компонент SPA — заменяет pages/_app.tsx.
 *
 * Ключевые изменения vs Next.js:
 * - Providers получает данные через usePageData(), не из getStaticProps props
 * - BrowserRouter вместо Next.js router
 * - next/head → мета-теги статически в index.html
 * - Убран withCsp wrapper (CSP выставляется Fastify сервером)
 * - nprogress адаптирован под React Router через NavigationProgress
 */

import { memo, Suspense, lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from '@lidofinance/lido-ui';
import 'nprogress/nprogress.css';

import { config } from 'config';
import { STRATEGY_LAZY } from 'consts/react-query-strategies';
import { Providers } from 'providers';
import { BackgroundGradient } from 'shared/components/background-gradient';
import { ErrorBoundaryFallback } from 'shared/components/error-boundary';
import { SecurityStatusBanner } from 'features/ipfs';
import { usePageData } from './hooks/usePageData';
import { NavigationProgress } from './components/NavigationProgress';

// In IPFS mode use HashRouter (no server to handle /path requests).
// In normal mode use BrowserRouter for clean URLs.
const Router = config.ipfsMode ? HashRouter : BrowserRouter;

// Ленивая загрузка страниц для code splitting
const StakePage = lazy(() => import('./pages/StakePage'));
const WrapPage = lazy(() => import('./pages/WrapPage'));
const EarnPage = lazy(() => import('./pages/EarnPage'));
const EarnVaultPage = lazy(() => import('./pages/EarnVaultPage'));
const EarnVaultActionPage = lazy(() => import('./pages/EarnVaultActionPage'));
const WithdrawalsPage = lazy(() => import('./pages/WithdrawalsPage'));
const RewardsPage = lazy(() => import('./pages/RewardsPage'));
const ReferralPage = lazy(() => import('./pages/ReferralPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      ...STRATEGY_LAZY,
    },
  },
});

// Компонент-обёртка: загружает page-data и инициализирует Providers
const AppWithProviders = () => {
  const { data: pageData, isLoading, error } = usePageData();

  if (isLoading) {
    // Минимальный скелетон пока грузится конфиг
    return null;
  }

  if (error) {
    console.error('[App] Failed to load page data:', error);
  }

  return (
    <Providers
      prefetchedManifest={pageData?.___prefetch_manifest___}
      validationFile={pageData?.__validation_file__}
    >
      <BackgroundGradient
        width={1560}
        height={784}
        style={{ opacity: 'var(--lido-color-darkThemeOpacity)' }}
      />
      <ToastContainer />
      <NavigationProgress />

      <ErrorBoundary fallbackRender={ErrorBoundaryFallback}>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<StakePage />} />
            <Route path="/wrap" element={<WrapPage />} />
            <Route path="/wrap/:mode" element={<WrapPage />} />
            <Route path="/earn" element={<EarnPage />} />
            <Route path="/earn/:vault" element={<EarnVaultPage />} />
            <Route
              path="/earn/:vault/:action"
              element={<EarnVaultActionPage />}
            />
            <Route
              path="/withdrawals"
              element={<Navigate to="/withdrawals/request" replace />}
            />
            <Route path="/withdrawals/:mode" element={<WithdrawalsPage />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/referral" element={<ReferralPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>

      <SecurityStatusBanner />
    </Providers>
  );
};

const MemoAppWithProviders = memo(AppWithProviders);

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <Router>
      <MemoAppWithProviders />
    </Router>
  </QueryClientProvider>
);
