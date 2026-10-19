<!--
Источник: https://router.effector.dev/core/
Снято скриптом scripts/fetch-router-docs.sh — не править вручную.
-->

# Core ​
The core package of effector/router Router provides the fundamental routing primitives powered by Effector.

## Overview ​
@effector/router is the foundation of effector/router Router. It provides:

- Route Creation - Define routes with paths and parameters
- Router Management - Central navigation state management
- Type Safety - Full TypeScript support with automatic type inference
- State Management - Powered by Effector for predictable updates
- Query Tracking - Monitor and react to query parameter changes

## Installation ​
bashnpm install @effector/router effector

## Key Concepts ​

### Routes ​
Routes represent navigable locations in your app. They can be created with or without a path:
Path routes - Routes with URL paths:
tsximport { createRoute } from '@effector/router';

const homeRoute = createRoute({ path: '/home' });
const userRoute = createRoute({ path: '/user/:id' });

Pathless routes - Routes without URL paths:
tsxconst dialogRoute = createRoute(); // No path
const modalRoute = createRoute<{ title: string }>(); // With typed params

All routes have:

- State stores: $isOpened, $params, $isPending
- Events: open, opened, closed
- Optional: parent; deprecated compatibility preparation: beforeOpen

### Router ​
The router manages multiple routes and their state. You can register routes with paths directly, or assign paths to pathless routes:
tsximport { createRouter } from '@effector/router';

// Routes with paths
const router = createRouter({
  routes: [homeRoute, userRoute, profileRoute],
});

// Pathless routes need paths assigned in router
const dialogRoute = createRoute();
const router = createRouter({
  routes: [
    homeRoute,
    { path: '/dialog', route: dialogRoute }, // Assign path here
  ],
});

### Navigation ​
Navigate by opening routes:
tsx// Simple navigation
homeRoute.open();

// With parameters
userRoute.open({ params: { id: '123' } });

// With query parameters
homeRoute.open({ query: { tab: 'settings' } });

// Replace instead of push
profileRoute.open({ replace: true });

## Core APIs ​

### Route Management ​

- createRoute - Create a route with path and parameters
- createVirtualRoute - Create a route without a path
- beforeNavigate - Hold or confirm before history changes
- redirect - Compose semantic route redirects
- chainRoute - Derive post-commit route readiness

### Router Management ​

- createRouter - Create a router instance
- createRouterControls - Create router controls separately

### Advanced Features ​

- trackQuery - Track query parameter changes
- group - Group related routes
- Routes and query - Route identity vs query state

## Quick Example ​
tsximport { createRoute, createRouter, historyAdapter } from '@effector/router';
import { createMemoryHistory } from 'history';

// 1. Create routes
const homeRoute = createRoute({ path: '/home' });
const profileRoute = createRoute({ path: '/profile/:id' });

// 2. Create router
const router = createRouter({
  routes: [homeRoute, profileRoute],
});

// 3. Connect to history
const history = createMemoryHistory();
router.setHistory(historyAdapter(history));

// 4. Navigate
homeRoute.open(); // Opens /home
profileRoute.open({ params: { id: '123' } }); // Opens /profile/123

// 5. React to state changes
router.$path.watch((path) => {
  console.log('Current path:', path);
});

homeRoute.$isOpened.watch((isOpened) => {
  console.log('Home route opened:', isOpened);
});

## Type Safety ​
effector/router Router provides full type safety:
tsxconst userRoute = createRoute({ path: '/user/:id/:section' });
// Type: Route<{ id: string; section: string }>

// ✅ Type-safe
userRoute.open({ params: { id: '1', section: 'posts' } });

// ❌ TypeScript error
userRoute.open({ params: { id: 1 } }); // id must be string
userRoute.open({ params: { id: '1' } }); // section is required

## Next Steps ​

- createRoute - Learn about creating routes
- createRouter - Set up your router
- React Package - Use with React
- React Native Package - Use with React Native
