<!--
Источник: https://router.effector.dev/react/
Снято скриптом scripts/fetch-router-docs.sh — не править вручную.
-->

# React ​
React bindings for effector/router Router, providing hooks and components for seamless integration.

## Overview ​
@effector/router-react provides React-specific utilities to use effector/router Router in your React applications:

- Route Views - Connect routes to React components
- Navigation Components - Link and navigation helpers
- Hooks - Access router state in components
- Layouts - Wrap multiple routes with shared layouts

## Installation ​
bashnpm install @effector/router-react @effector/router effector effector-react react

## Key Concepts ​

### Route Views ​
Route Views connect effector/router Router routes to React components:
tsximport { createRouteView } from '@effector/router-react';

const HomeScreen = createRouteView({
  route: homeRoute,
  view: () => <div>Home</div>,
});

### Router Provider ​
Provide the router to your React tree:
tsximport { RouterProvider } from '@effector/router-react';

function App() {
  return (
    <RouterProvider router={router}>
      <YourApp />
    </RouterProvider>
  );
}

### Routes View ​
Render the currently opened route:
tsximport { createRoutesView } from '@effector/router-react';

const RoutesView = createRoutesView({
  routes: [HomeScreen, ProfileScreen, SettingsScreen],
  otherwise: NotFoundScreen,
});

function App() {
  return <RoutesView />;
}

## React APIs ​

### Component Creation ​

- createRouteView - Create a route view component
- createLazyRouteView - Create a lazy-loaded route view
- createRoutesView - Create a routes renderer

### Navigation ​

- Link - Navigation link component

### Router Access ​

- useRouter - Access the router with store values bound for React rendering
- useRouterContext - Access the raw router and bind selected stores with useUnit

### Utilities ​

- withLayout - Wrap routes with shared layouts

## Quick Example ​
tsximport { createRouter, createRoute } from '@effector/router';
import {
  RouterProvider,
  createRouteView,
  createRoutesView,
  Link,
} from '@effector/router-react';

// 1. Create routes
const homeRoute = createRoute({ path: '/home' });
const aboutRoute = createRoute({ path: '/about' });

// 2. Create router
const router = createRouter({
  routes: [homeRoute, aboutRoute],
});

// 3. Create route views
const HomeScreen = createRouteView({
  route: homeRoute,
  view: () => (
    <div>
      <h1>Home</h1>
      <Link to={aboutRoute}>Go to About</Link>
    </div>
  ),
});

const AboutScreen = createRouteView({
  route: aboutRoute,
  view: () => (
    <div>
      <h1>About</h1>
      <Link to={homeRoute}>Go to Home</Link>
    </div>
  ),
});

// 4. Create routes view
const RoutesView = createRoutesView({
  routes: [HomeScreen, AboutScreen],
});

// 5. Use in app
function App() {
  return (
    <RouterProvider router={router}>
      <RoutesView />
    </RouterProvider>
  );
}

## Using Route Parameters ​
Access route parameters with Effector React hooks:
tsximport { useUnit } from 'effector-react';

const userRoute = createRoute({ path: '/user/:id' });

const UserScreen = createRouteView({
  route: userRoute,
  view: () => {
    const params = useUnit(userRoute.$params);
    return <div>User ID: {params.id}</div>;
  },
});

## Lazy Loading ​
Load route components on demand:
tsximport { createLazyRouteView } from '@effector/router-react';

const ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: () => import('./screens/ProfileScreen'),
  fallback: () => <div>Loading...</div>,
});

## Layouts ​
Share layouts across multiple routes:
tsximport { withLayout } from '@effector/router-react';

const MainLayout = ({ children }) => (
  <div>
    <header>Header</header>
    {children}
    <footer>Footer</footer>
  </div>
);

const RoutesView = createRoutesView({
  routes: [
    ...withLayout(MainLayout, [HomeScreen, AboutScreen, ContactScreen]),
    LoginScreen, // Without layout
  ],
});

## Type Safety ​
Route parameters are type-safe in components:
tsxconst postRoute = createRoute({ path: '/post/:id' });
// Type: Route<{ id: string }>

const PostScreen = createRouteView({
  route: postRoute,
  view: () => {
    const params = useUnit(postRoute.$params);
    // params is typed as { id: string }
    return <div>Post {params.id}</div>;
  },
});

## Next Steps ​

- createRouteView - Create route views
- createRoutesView - Render routes
- Link - Navigation links
- Core Package - Learn about core concepts
