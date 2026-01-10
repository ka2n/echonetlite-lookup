import { createRoute } from '@tanstack/react-router';
import { Route as RootRoute } from './__root';
import { SearchBar } from '../components/SearchBar';

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="index-page">
      <h2>ECHONET Liteメーカーコード検索</h2>
      <p>ECHONET Liteで使用されるメーカーコードを検索できます</p>
      <SearchBar />
    </div>
  );
}
