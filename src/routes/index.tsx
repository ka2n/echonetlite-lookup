import { createRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { Route as RootRoute } from './__root';
import { SearchBar } from '../components/SearchBar';
import { ManufacturerList } from '../components/ManufacturerList';
import { searchManufacturersOr } from '../lib/search';
import manufacturersData from '../data/manufacturers.json';
import { useState, useTransition, useCallback } from 'react';

type IndexSearchParams = {
  q?: string;
};

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  component: IndexPage,
  validateSearch: (search: Record<string, unknown>): IndexSearchParams => ({
    q: typeof search.q === 'string' ? search.q : undefined,
  }),
});

function IndexPage(): React.ReactElement {
  const searchParams = useSearch({ from: '/' });
  const initialQuery = searchParams.q || '';
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();

  const [results, setResults] = useState(() =>
    initialQuery ? searchManufacturersOr(initialQuery) : manufacturersData.manufacturers
  );

  const executeSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      const newResults = trimmed ? searchManufacturersOr(query) : manufacturersData.manufacturers;
      const newSearch = trimmed ? { q: query } : {};

      setResults(newResults);
      navigate({ to: '/', search: newSearch, replace: true });
    },
    [navigate]
  );

  const handleRealtimeSearch = useCallback(
    (query: string) => {
      startTransition(() => executeSearch(query));
    },
    [executeSearch]
  );

  const handleSubmit = useCallback(
    (query: string) => executeSearch(query),
    [executeSearch]
  );

  return (
    <div className="index-page">
      <h2>ECHONET Lite メーカーコード検索</h2>
      <p>ECHONET Liteで使用されるメーカーコードを検索できます</p>

      <SearchBar
        onRealtimeSearch={handleRealtimeSearch}
        onSubmit={handleSubmit}
        initialQuery={initialQuery}
        isPending={isPending}
        mode="realtime"
      />

      {/* Search results with accessibility attributes */}
      <div
        className="search-results"
        aria-live="polite"
        aria-busy={isPending}
        role="region"
        aria-label="検索結果"
      >
        <ManufacturerList manufacturers={results} />
      </div>
    </div>
  );
}
