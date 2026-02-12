// Server configuration returned by /api/config
export interface ServerConfig {
  // Whether JWT signing is enabled (hides credentials UI)
  jwtAuthEnabled: boolean;
  // Pre-configured domains (when set, hides respective UI inputs)
  supersetFrontendDomain?: string;
  supersetApiDomain?: string;
  permalinkDomain?: string;
}

export interface DashboardConfig {
  supersetFrontendDomain: string;  // Frontend domain (e.g., http://localhost:9000)
  supersetApiDomain: string;       // Backend API domain (e.g., http://localhost:8088)
  // Credentials are optional when JWT auth is enabled
  supersetUsername?: string;
  supersetPassword?: string;
  dashboardId: string;             // Dashboard embed ID (also used as UUID for guest token)
  rls: string;
  uiConfig: string;
  permalinkDomain?: string;        // Domain for resolving permalinks (defaults to Superset API Domain)
}

export interface LogEvent {
  id: string;
  timestamp: Date;
  type: 'dataMask' | 'chartStates' | 'activeTabs' | 'scrollSize' | 'error' | 'info' | 'features';
  data: unknown;
}

export interface AvailableFeatures {
  hasObserveDataMask: boolean;
  hasGetDataMask: boolean;
  hasGetChartStates: boolean;
  hasGetActiveTabs: boolean;
  hasGetScrollSize: boolean;
  hasSetThemeMode: boolean;
  hasSetThemeConfig: boolean;
  hasGetDashboardPermalink: boolean;
  hasUnmount: boolean;
}

// Request body depends on server configuration
export interface GuestTokenRequest {
  dashboardId: string;
  rls: Array<{ clause: string }>;
  // Only included when JWT auth is NOT enabled
  supersetApiDomain?: string;
  supersetUsername?: string;
  supersetPassword?: string;
}

// Generic type for the dashboard to handle different SDK versions
export interface EmbeddedDashboardInstance {
  unmount?: () => void;
  observeDataMask?: (callback: (dataMask: Record<string, unknown>) => void) => void;
  getDataMask?: () => Promise<Record<string, unknown>>;
  getChartStates?: () => Promise<Record<string, unknown>>;
  getActiveTabs?: () => Promise<string[]>;
  getScrollSize?: () => Promise<{ width: number; height: number }>;
  setThemeMode?: (mode: string) => void;
  setThemeConfig?: (config: Record<string, unknown>) => void;
  getDashboardPermalink?: (anchor: string) => Promise<string>;
}
