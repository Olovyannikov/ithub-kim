<!--
Источник: https://router.effector.dev/introduction/getting-started
Снято скриптом scripts/fetch-router-docs.sh — не править вручную.
-->

# Getting started ​

## Installation ​
pnpmnpmyarn
bashpnpm add @effector/router history

bashnpm install @effector/router history

bashyarn add @effector/router history

TIP
In an SSR project you must add @effector/router in "factories" list in effector babel plugin

## React bindings ​
pnpmnpmyarn
bashpnpm add @effector/router-react

bashnpm install @effector/router-react

bashyarn add @effector/router-react

## Vue bindings ​
pnpmnpmyarn
bashpnpm add @effector/router-vue effector-vue vue

bashnpm install @effector/router-vue effector-vue vue

bashyarn add @effector/router-vue effector-vue vue

TIP
@effector/router-vue supports only the latest Vue 3 (^3.5). See the Vue guide for the full API.

## Writing first router ​
As an example, we will write a simple router with feed and profile routes.
ts// shared/routing.ts
import { createRoute, createRouter } from '@effector/router';

export const routes = {
  feed: createRoute({ path: '/' }),
  profile: createRoute({ path: '/profile' }),
};

export const router = createRouter({
  routes: [routes.feed, routes.profile],
});

tsx// profile.tsx
import { createRouteView } from '@effector/router-react';
import { routes } from './shared/routing';

const Profile = () => {
  return <>...</>;
};

export const ProfileScreen = createRouteView({
  route: routes.profile,
  view: Profile,
});

tsx// feed.tsx
import { createRouteView } from '@effector/router-react';
import { routes } from './shared/routing';

const Feed = () => {
  return <>...</>;
};

export const FeedScreen = createRouteView({ route: routes.feed, view: Feed });

tsx// app.tsx
import { RouterProvider, createRoutesView } from '@effector/router-react';
import { FeedScreen, ProfileScreen } from './screens';
import { router } from './shared/routing';

const RoutesView = createRoutesView({ routes: [FeedScreen, ProfileScreen] });

export function App() {
  return (
    <RouterProvider router={router}>
      <RoutesView />
    </RouterProvider>
  );
}

WARNING
The router must be initialized with the setHistory event, which requires memory or browser history from the history package.
tsimport { createRoot } from 'react-dom/client';
import { allSettled, fork } from 'effector';
import { historyAdapter } from '@effector/router';
import { createBrowserHistory } from 'history';
import { Provider } from 'effector-react';
import { router } from './shared/routing';
import { App } from './app';

const root = createRoot(document.getElementById('root')!);

async function render() {
  const scope = fork();

  await allSettled(router.setHistory, {
    scope,
    params: historyAdapter(createBrowserHistory()),
  });

  root.render(
    <Provider value={scope}>
      <App />
    </Provider>,
  );
}

render();

## Next steps ​
For a complete, step-by-step walkthrough with expected results at each step, see the Build your first router tutorial.
