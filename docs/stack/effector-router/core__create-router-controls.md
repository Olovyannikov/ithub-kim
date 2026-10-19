<!--
Источник: https://router.effector.dev/core/create-router-controls
Снято скриптом scripts/fetch-router-docs.sh — не править вручную.
-->

# createRouterControls ​
Create the core navigation controls for managing browser history, URL paths, and query parameters. These controls are typically used internally by createRouter, but can also be used independently for custom routing solutions.

## API ​
typescriptfunction createRouterControls(): RouterControls;

### Returns ​
RouterControls object with the following properties:
PropertyTypeDescription
$historyStore<RouterAdapter | null>Current history adapter instance
$locationStateStore<LocationState>Current path and query state
$queryStore<Query>Current query parameters
$pathStore<string>Current pathname
setHistoryEvent<RouterAdapter>Initialize controls with history adapter
navigateEvent<NavigatePayload>Navigate to a path with query parameters
backEvent<void>Navigate back in history
forwardEvent<void>Navigate forward in history
locationUpdatedEvent<{ pathname, query }>Fires when location changes

## Usage ​

### Basic Setup ​
tsimport { createRouterControls, historyAdapter } from '@effector/router';
import { createBrowserHistory } from 'history';

const controls = createRouterControls();

// Initialize with browser history
controls.setHistory(historyAdapter(createBrowserHistory()));

Initialization Required
Router controls should be initialized with setHistory before use. Before initialization, navigate, back, and forward emit controls.navigationFailed with a discriminated not-initialized payload and do not throw or create a navigation attempt.
controls.initialized and controls.updated expose the same location lifecycle as Router. Reinitialization emits initialized; equal or hash-only changes do not emit updated.

### Navigate to Paths ​
tsimport { sample } from 'effector';

// Navigate to a new path
sample({
  clock: goToHomePage,
  fn: () => ({ path: '/' }),
  target: controls.navigate,
});

// Navigate with query parameters
sample({
  clock: searchSubmitted,
  fn: (searchTerm) => ({
    path: '/search',
    query: { q: searchTerm },
  }),
  target: controls.navigate,
});

// Replace current history entry
sample({
  clock: updateFilters,
  fn: (filters) => ({
    query: { filters },
    replace: true, // Don't add new history entry
  }),
  target: controls.navigate,
});

### Update Query Parameters ​
tsimport { sample } from 'effector';

// Add query parameters while keeping current path
sample({
  clock: filterChanged,
  fn: (filter) => ({
    query: { filter, page: '1' },
  }),
  target: controls.navigate,
});

// Clear specific query parameter
sample({
  clock: clearSearch,
  fn: () => ({ query: { q: undefined } }),
  target: controls.navigate,
});

### Navigate Back/Forward ​
tsimport { sample } from 'effector';

// Browser back button
sample({
  clock: backButtonClicked,
  target: controls.back,
});

// Browser forward button
sample({
  clock: forwardButtonClicked,
  target: controls.forward,
});

### Read Current State ​
tsimport { useUnit } from 'effector-react';

function CurrentLocation() {
  const path = useUnit(controls.$path);
  const query = useUnit(controls.$query);

  return (
    <div>
      <p>Path: {path}</p>
      <p>Query: {JSON.stringify(query)}</p>
    </div>
  );
}

### Track Query Parameters ​
tsimport { z } from 'zod';
import { trackQuery } from '@effector/router';

const searchTracker = trackQuery({
  parameters: z.object({
    q: z.string(),
    page: z.string().default('1'),
  }),
  controls,
});

searchTracker.entered.watch(({ q, page }) => {
  console.log(`Searching for "${q}" (page ${page})`);
});

// Add or update the tracked parameters
searchTracker.enter({ q: 'router', page: '2' });

Config fieldTypeDescription
controlsRouterControlsControls that own query navigation
routesRoute[]Optional OR filter based on each route's $isOpened store
parametersZodTypeSchema used to validate and parse the tracked query parameters
The tracker reacts automatically to query and route activity. Its $state store exposes the current inactive, pending, or entered state, including when a tracker is created after history initialization. Compose one-shot behavior from that store and an application event with sample.

### Server-Side Rendering ​
tsimport { createRouterControls, historyAdapter } from '@effector/router';
import { createMemoryHistory } from 'history';
import { fork, allSettled } from 'effector';

const controls = createRouterControls();
const scope = fork();

// Initialize with memory history for SSR
await allSettled(controls.setHistory, {
  scope,
  params: historyAdapter(
    createMemoryHistory({
      initialEntries: ['/products/123'],
    }),
  ),
});

### Custom History Adapter ​
tsimport { createRouterControls, type RouterAdapter } from '@effector/router';

const controls = createRouterControls();

// Use custom adapter
const customAdapter = {
  location: {
    pathname: '/current-path',
    search: '?query=value',
    hash: '',
  },
  push: (location) => {
    console.log('Navigate to:', location);
  },
  replace: (location) => {
    console.log('Replace with:', location);
  },
  goBack: () => console.log('Go back'),
  goForward: () => console.log('Go forward'),
  listen: (listener) => {
    // Subscribe to location changes
    return {
      unsubscribe: () => {
        // Cleanup
      },
    };
  },
} satisfies RouterAdapter;

controls.setHistory(customAdapter);

### React to Location Changes ​
tsimport { sample } from 'effector';

// Track all navigation
sample({
  clock: controls.locationUpdated,
  fn: ({ pathname, query }) => {
    console.log('Navigated to:', pathname, query);
  },
});

// Analytics tracking
sample({
  clock: controls.locationUpdated,
  fn: ({ pathname }) => ({
    event: 'pageview',
    path: pathname,
  }),
  target: sendAnalyticsFx,
});

### Derive State from Path ​
tsimport { combine } from 'effector';

const $isHomePage = controls.$path.map((path) => path === '/');

const $currentSection = controls.$path.map((path) => {
  if (path.startsWith('/docs')) return 'docs';
  if (path.startsWith('/blog')) return 'blog';
  return 'home';
});

const $breadcrumbs = controls.$path.map((path) => {
  return path.split('/').filter(Boolean);
});

## NavigatePayload ​
The navigate event accepts the following payload:
typescriptinterface NavigatePayload {
  path?: string; // Optional: new pathname
  query?: Query; // Optional: query parameters
  replace?: boolean; // Optional: replace history entry (default: false)
}

When path or query is omitted, controls reuse the current value. Therefore controls.navigate({ path: '/settings' }) preserves the current query.
When query is provided, it replaces the complete query. Use query: {} to clear every key; use undefined for individual keys that should be absent. Route open, redirect targets, and framework link hrefs use the same effective URL rule, so a clicked link and native navigation resolve to the same query.

## Query Type ​
Query parameters are represented as:
typescripttype Query = Record<string, string | null | Array<string | null>>;
type QueryInput = Record<
  string,
  string | null | Array<string | null> | undefined
>;

Examples:
ts// Single value
{
  search: 'apple';
}

// Multiple values
{
  tags: ['javascript', 'typescript'];
}

// Remove parameter (undefined is omitted from the URL)
{
  filter: undefined;
}

null is serialized as a flag (?enabled), arrays use repeated keys in the same order, and object key order does not affect value equality.

## Best Practices ​

### Share Controls with Lower Layers ​
Create controls beside route declarations when feature models need to compose transition policy without importing the application router:
ts// shared/routing
export const controls = createRouterControls();
export const routes = {
  /* createRoute declarations */
};

// feature model
export const leaveEditor = beforeNavigate({
  controls,
  from: routes.editor,
  filter: $dirty,
});

// app/routing
const router = createRouter({
  routes: Object.values(routes),
  controls,
});

The app remains responsible for setHistory. See Navigation lifecycle.

### Initialize Early ​
Initialize history adapter as early as possible:
ts// In app entry point
import { createBrowserHistory } from 'history';

controls.setHistory(historyAdapter(createBrowserHistory()));

### Batch Query Updates ​
Use replace: true when updating query parameters frequently:
ts// ❌ Creates multiple history entries
controls.navigate({ query: { page: '1' } });
controls.navigate({ query: { filter: 'active' } });

// ✅ Single history entry
controls.navigate({
  query: { page: '1', filter: 'active' },
  replace: true,
});

## See Also ​

- createRouter - Create complete router with controls
- Adapters - History adapters and custom adapter creation
- trackQuery - Track individual query parameters
- Routes and query - Route identity vs query state
