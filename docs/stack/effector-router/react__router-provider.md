<!--
Источник: https://router.effector.dev/react/router-provider
Снято скриптом scripts/fetch-router-docs.sh — не править вручную.
-->

# RouterProvider ​
Context provider component that makes the router available to all child components.

## Import ​
tsimport { RouterProvider } from '@effector/router-react';

## Usage ​
tsximport { RouterProvider } from '@effector/router-react';
import { router } from './router';

function App() {
  return (
    <RouterProvider router={router}>
      <YourApp />
    </RouterProvider>
  );
}

## Props ​

### router (required) ​
The router instance created with createRouter:
tsximport { createRouter, createRoute } from '@effector/router';

const homeRoute = createRoute({ path: '/home' });
const router = createRouter({
  routes: [homeRoute],
});

function App() {
  return (
    <RouterProvider router={router}>
      <YourApp />
    </RouterProvider>
  );
}

### children (optional) ​
React components to render:
tsx<RouterProvider router={router}>
  <Layout>
    <RoutesView />
  </Layout>
</RouterProvider>

## With Effector Scope ​
For SSR or testing, wrap with Effector's Provider:
tsximport { fork } from 'effector';
import { Provider } from 'effector-react';
import { RouterProvider } from '@effector/router-react';

function App() {
  const scope = fork();

  return (
    <Provider value={scope}>
      <RouterProvider router={router}>
        <YourApp />
      </RouterProvider>
    </Provider>
  );
}

## Accessing Router ​
Once provided, use hooks to access the router:
tsximport { useRouter } from '@effector/router-react';

function Navigation() {
  const router = useRouter();

  return <button onClick={() => router.back()}>Go Back</button>;
}

## Multiple Routers ​
You can use multiple routers in different parts of your app:
tsximport { RouterProvider } from '@effector/router-react';

const mainRouter = createRouter({ routes: [homeRoute, aboutRoute] });
const adminRouter = createRouter({ routes: [dashboardRoute, usersRoute] });

function App() {
  return (
    <div>
      <RouterProvider router={mainRouter}>
        <MainApp />
      </RouterProvider>

      <RouterProvider router={adminRouter}>
        <AdminPanel />
      </RouterProvider>
    </div>
  );
}

## Error Handling ​
Components that use router hooks will throw an error if used outside RouterProvider:
tsxfunction Component() {
  // ❌ Error: Router not found. Add RouterProvider in app root
  const router = useRouter();
}

Always wrap your app with RouterProvider:
tsx// ✅ Correct
<RouterProvider router={router}>
  <Component />
</RouterProvider>

## Example: Complete Setup ​
tsximport { createRoot } from 'react-dom/client';
import { allSettled, fork } from 'effector';
import { Provider } from 'effector-react';
import { createBrowserHistory } from 'history';
import { RouterProvider } from '@effector/router-react';
import { historyAdapter } from '@effector/router';
import { router } from './router';
import { App } from './app';

const root = createRoot(document.getElementById('root')!);

async function render() {
  const scope = fork();
  const history = createBrowserHistory();

  // Initialize router with history
  await allSettled(router.setHistory, {
    scope,
    params: historyAdapter(history),
  });

  root.render(
    <Provider value={scope}>
      <RouterProvider router={router}>
        <App />
      </RouterProvider>
    </Provider>,
  );
}

render();

## See Also ​

- useRouter - Access router in components
- createRouter - Create router instance
- createRoutesView - Render active routes
