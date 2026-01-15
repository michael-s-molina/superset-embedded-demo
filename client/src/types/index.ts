export interface DashboardConfig {
  supersetFrontendDomain: string;  // Frontend domain (e.g., http://localhost:9000)
  supersetApiDomain: string;       // Backend API domain (e.g., http://localhost:8088)
  supersetUsername: string;
  supersetPassword: string;
  dashboardId: string;
  dashboardUuid: string;
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

export interface GuestTokenRequest {
  supersetApiDomain: string;
  supersetUsername: string;
  supersetPassword: string;
  dashboardId: string;
  rls: Array<{ clause: string }>;
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
