import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { lazy, Suspense } from 'react';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SitesPage = lazy(() => import('./pages/SitesPage'));
const SeoArticlesPage = lazy(() => import('./pages/SeoArticlesPage'));
const SeoArticleEditorPage = lazy(() => import('./pages/SeoArticleEditorPage'));
const SponsoredArticlesPage = lazy(() => import('./pages/SponsoredArticlesPage'));
const SponsoredArticleEditorPage = lazy(() => import('./pages/SponsoredArticleEditorPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const RevenuePage = lazy(() => import('./pages/RevenuePage'));
const PersonasPage = lazy(() => import('./pages/PersonasPage'));
const BulkSchedulerPage = lazy(() => import('./pages/BulkSchedulerPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/sites" element={<SitesPage />} />
          <Route path="/seo-articles" element={<SeoArticlesPage />} />
          <Route path="/seo-articles/new" element={<SeoArticleEditorPage />} />
          <Route path="/seo-articles/:id" element={<SeoArticleEditorPage />} />
          <Route path="/sponsored-articles" element={<SponsoredArticlesPage />} />
          <Route path="/sponsored-articles/new" element={<SponsoredArticleEditorPage />} />
          <Route path="/sponsored-articles/:id" element={<SponsoredArticleEditorPage />} />
          <Route path="/seo-forge/bulk" element={<BulkSchedulerPage />} />
          <Route path="/articles" element={<Navigate to="/seo-articles" replace />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/revenue" element={<RevenuePage />} />
          <Route path="/personas" element={<PersonasPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
