import { createRouter } from '@tanstack/react-router';
import { Route as rootRoute } from './routes/__root';
import { Route as indexRoute } from './routes/index';
import { Route as searchRoute } from './routes/search';
import { Route as aboutRoute } from './routes/about';

const routeTree = rootRoute.addChildren([indexRoute, searchRoute, aboutRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
