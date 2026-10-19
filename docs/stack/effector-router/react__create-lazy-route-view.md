<!--
Источник: https://router.effector.dev/react/create-lazy-route-view
Снято скриптом scripts/fetch-router-docs.sh — не править вручную.
-->

# createLazyRouteView ​
Creates a lazy-loaded route view with code splitting support using React's lazy and Suspense.

## Import ​
tsimport { createLazyRouteView } from '@effector/router-react';

## Usage ​
tsximport { createLazyRouteView } from '@effector/router-react';
import { profileRoute } from './routes';

export const ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: () => import('./components/ProfileComponent'),
  fallback: () => <div>Loading...</div>,
});

The imported component must be exported as default:
tsx// components/ProfileComponent.tsx
export default function ProfileComponent() {
  return <div>Profile Page</div>;
}

## With Layout ​
Wrap the lazy-loaded view with a layout:
tsximport { MainLayout } from './layouts';

export const ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: () => import('./components/ProfileComponent'),
  layout: MainLayout,
  fallback: () => <div>Loading...</div>,
});

## Configuration ​

### route (required) ​
The effector/router Router route instance:
tsximport { createRoute } from '@effector/router';

const profileRoute = createRoute({ path: '/profile' });

const ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: () => import('./ProfileComponent'),
});

### view (required) ​
Dynamic import function that returns a promise with default export:
tsxconst ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: () => import('./ProfileComponent'),
});

### fallback (optional) ​
Component to display while the view is loading. Defaults to empty fragment:
tsxconst ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: () => import('./ProfileComponent'),
  fallback: () => (
    <div className="loading">
      <Spinner />
      <p>Loading profile...</p>
    </div>
  ),
});

### layout (optional) ​
Layout component to wrap the view:
tsxfunction MainLayout({ children }) {
  return (
    <div>
      <header>Header</header>
      {children}
      <footer>Footer</footer>
    </div>
  );
}

const ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: () => import('./ProfileComponent'),
  layout: MainLayout,
});

### children (optional) ​
Nested route views:
tsxconst ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: () => import('./ProfileComponent'),
  children: [
    createRouteView({ route: settingsRoute, view: SettingsComponent }),
  ],
});

## CreateLazyRouteViewProps ​
CreateLazyRouteViewProps<T> is the public configuration type accepted by createLazyRouteView.
tsimport type { CreateLazyRouteViewProps } from '@effector/router-react';

PropertyTypeDescription
routeRoute<T>Route that controls whether the lazy view is active. Router targets are not supported for lazy views.
view() => Promise<{ default: ComponentType }>Dynamic importer whose module has a default React component export.
fallbackComponentTypeOptional component rendered by Suspense while the module loads.
layoutComponentType<{ children: ReactNode }>Optional layout that wraps the lazy view.
childrenRouteView[]Optional direct child views rendered through [Outlet].

## Return Value ​
Returns a RouteView object that renders the lazy-loaded component wrapped in React Suspense.

## Code Splitting ​
Lazy route views enable automatic code splitting - the component code is only loaded when the route is first opened:
tsx// App bundle: ~100KB
// Profile component: ~50KB

// User visits homepage → Only app bundle loads (100KB)
// User navigates to profile → Profile component loads (50KB)

The importer starts when the route view renders, not when route.open() is called. React Suspense can therefore commit the configured fallback while the chunk is loading. Route or chained $isPending represents model preparation; chunk loading is observed by the Suspense boundary.

## Preloading ​
Reuse one importer for rendering and an application-owned preload Effect:
tsximport { createEffect, sample } from 'effector';

const importProfile = () => import('./components/ProfileComponent');
const preloadProfileFx = createEffect(importProfile);

export const ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: importProfile,
  fallback: () => <ProfileSkeleton />,
});

sample({ clock: profileLinkHovered, target: preloadProfileFx });

Do not call route.open() recursively from beforeOpen: it creates another navigation intent instead of preloading a chunk.

## See Also ​

- createRouteView - Non-lazy route views
- createRoutesView - Render active routes
- withLayout - Apply layouts to multiple routes
