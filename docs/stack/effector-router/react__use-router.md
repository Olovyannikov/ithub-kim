<!--
Источник: https://router.effector.dev/react/use-router
Снято скриптом scripts/fetch-router-docs.sh — не править вручную.
-->

# useRouter ​
Hook to access the router instance from RouterProvider context. Returns the router with all stores bound to their current values using useUnit.

## Import ​
tsimport { useRouter } from '@effector/router-react';

## Usage ​
tsximport { useRouter } from '@effector/router-react';

function Navigation() {
  const router = useRouter();

  return <button onClick={() => router.back()}>Go Back</button>;
}

## Return Value ​
Returns the router instance with all store values automatically bound (not stores themselves):
tsxfunction Component() {
  const router = useRouter();

  // Access current values (NOT stores)
  router.$path; // string (current path value)
  router.$query; // Query (current query value)
  router.$activeRoutes; // Route<any>[] (current active routes)

  // Navigation methods
  router.back(); // Go back
  router.forward(); // Go forward
  router.navigate({ path: '/home' });

  // ...other router properties
}

INFO
useRouter() uses useUnit internally to bind all stores to their values. The component will automatically re-render when any store value changes.

## Examples ​

### Navigate Back/Forward ​
tsximport { useRouter } from '@effector/router-react';

function HistoryControls() {
  const router = useRouter();

  return (
    <div>
      <button onClick={() => router.back()}>← Back</button>
      <button onClick={() => router.forward()}>Forward →</button>
    </div>
  );
}

### Custom Navigation ​
tsximport { useRouter } from '@effector/router-react';

function SearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    router.navigate({
      path: '/search',
      query: { q: query },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <button>Search</button>
    </form>
  );
}

### Track Active Routes ​
tsximport { useRouter } from '@effector/router-react';

function Breadcrumbs() {
  const router = useRouter();
  // router.$activeRoutes is already the value, not a store
  const activeRoutes = router.$activeRoutes;

  return (
    <nav>
      {activeRoutes.map((route, index) => (
        <span key={index}> / {route.path}</span>
      ))}
    </nav>
  );
}

### Read Current Path ​
tsximport { useRouter } from '@effector/router-react';

function CurrentPath() {
  const router = useRouter();
  // router.$path is already the value, not a store
  const path = router.$path;

  return <div>Current path: {path}</div>;
}

## Error Handling ​
The hook throws an error if used outside of RouterProvider:
tsxfunction Component() {
  // ❌ Error: Router not found. Add RouterProvider in app root
  const router = useRouter();
}

Always wrap your app with RouterProvider:
tsximport { RouterProvider } from '@effector/router-react';

function App() {
  return (
    <RouterProvider router={router}>
      <YourApp />
    </RouterProvider>
  );
}

## See Also ​

- useRouterContext - Access router without Effector binding
- RouterProvider - Provide router to React tree
- Link - Navigation component
- createRouter - Create router instance

## useRouterContext ​
useRouterContext is a public hook that returns the raw router from RouterProvider. Unlike useRouter, it leaves router stores unbound so you can select and bind them with useUnit.
Alternative hook that returns the raw router with stores (not values):
tsimport { useRouterContext } from '@effector/router-react';

tsximport { useRouterContext } from '@effector/router-react';
import { useUnit } from 'effector-react';

function Component() {
  const router = useRouterContext();

  // router.$path is a Store<string>, must bind with useUnit
  const path = useUnit(router.$path);

  // Or bind multiple stores at once
  const { $path, $query, $activeRoutes } = useUnit({
    $path: router.$path,
    $query: router.$query,
    $activeRoutes: router.$activeRoutes,
  });
}

When to use:

- Use useRouter() - for most cases (automatically bound values)
- Use useRouterContext() - when you need raw stores for custom Effector patterns or selective binding
