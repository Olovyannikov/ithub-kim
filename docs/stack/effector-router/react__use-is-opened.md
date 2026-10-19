<!--
Источник: https://router.effector.dev/react/use-is-opened
Снято скриптом scripts/fetch-router-docs.sh — не править вручную.
-->

# useIsOpened ​
Check if a route or router is currently active.

## API ​
typescriptfunction useIsOpened(route: Route | Router): boolean;

### Parameters ​
ParameterTypeDescription
routeRoute | RouterThe route or router to check

### Returns ​
boolean - true if the route is opened or router has active routes, false otherwise.

## Usage ​

### Check Route State ​
tsximport { useIsOpened } from '@effector/router-react';
import { homeRoute, settingsRoute } from './routes';

function Navigation() {
  const isHomeActive = useIsOpened(homeRoute);
  const isSettingsActive = useIsOpened(settingsRoute);

  return (
    <nav>
      <a href="/home" className={isHomeActive ? 'active' : ''}>
        Home
      </a>
      <a href="/settings" className={isSettingsActive ? 'active' : ''}>
        Settings
      </a>
    </nav>
  );
}

### Check Router State ​
tsximport { useIsOpened } from '@effector/router-react';
import { adminRouter } from './routers';

function AdminPanel() {
  const isAdminActive = useIsOpened(adminRouter);

  if (!isAdminActive) {
    return null;
  }

  return <div>Admin Panel Content</div>;
}

### Conditional Rendering ​
tsximport { useIsOpened } from '@effector/router-react';
import { profileRoute } from './routes';

function UserMenu() {
  const isProfileOpen = useIsOpened(profileRoute);

  return (
    <div>
      <button>Menu</button>
      {isProfileOpen && (
        <div className="submenu">
          <a href="/profile/settings">Settings</a>
          <a href="/profile/billing">Billing</a>
        </div>
      )}
    </div>
  );
}

### Active Tab Indicator ​
tsximport { useIsOpened } from '@effector/router-react';
import { dashboardRoute, reportsRoute, analyticsRoute } from './routes';

const tabs = [
  { route: dashboardRoute, label: 'Dashboard' },
  { route: reportsRoute, label: 'Reports' },
  { route: analyticsRoute, label: 'Analytics' },
];

function Tab({ route, label }) {
  const isActive = useIsOpened(route);

  return (
    <button
      onClick={() => route.open()}
      className={isActive ? 'tab-active' : 'tab-inactive'}
    >
      {label}
    </button>
  );
}

function TabNavigation() {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <Tab key={tab.label} {...tab} />
      ))}
    </div>
  );
}

## How It Works ​

- For routes: Returns the value of route.$isOpened store
- For routers: Returns true if router.$activeRoutes has any items

## Best Practices ​

### Use for UI State Only ​
useIsOpened is perfect for visual indicators and conditional styling:
tsxfunction Sidebar() {
  const isSettingsOpen = useIsOpened(settingsRoute);

  return (
    <aside>
      <Link to={settingsRoute}>Settings {isSettingsOpen && '•'}</Link>
    </aside>
  );
}

### Combine with Other Hooks ​
tsximport { useIsOpened, useRouter } from '@effector/router-react';

function NavItem({ route, children }) {
  const isActive = useIsOpened(route);
  const router = useRouter();

  return (
    <button
      onClick={() => route.open()}
      disabled={isActive}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
    </button>
  );
}

### Performance ​
The hook subscribes to Effector stores and automatically updates when the route state changes. It's optimized and safe to use in multiple components.

## See Also ​

- Link - Navigation component with automatic active state
- useRouter - Access router instance
- useOpenedViews - Get all currently opened route views
