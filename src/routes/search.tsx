import { createRoute } from '@tanstack/react-router';
import { Route as RootRoute } from './__root';
import { searchManufacturers, type SearchType } from '../lib/search';
import { ManufacturerList } from '../components/ManufacturerList';
import { SearchBar } from '../components/SearchBar';

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/search',
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || '',
    type: ((search.type as string) || 'name') as SearchType,
  }),
});

function SearchPage() {
  const { q, type } = Route.useSearch();
  const results = searchManufacturers({ query: q, type });

  return (
    <div className="search-page">
      <SearchBar />
      <ManufacturerList manufacturers={results} />
    </div>
  );
}
