import { createRootRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="app">
      <header className="header">
        <h1>
          <Link to="/">ECHONET Lite Lookup</Link>
        </h1>
        <nav>
          <Link to="/">ホーム</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>
          データソース:{' '}
          <a href="https://echonet.jp/spec_g/" target="_blank" rel="noopener noreferrer">
            ECHONET Consortium
          </a>
        </p>
      </footer>
    </div>
  );
}
