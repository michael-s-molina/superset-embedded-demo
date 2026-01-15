import { useState, useCallback, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ConfigProvider, theme } from "antd";
import { ConfigPanel } from "./components/ConfigPanel";
import { DashboardContainer } from "./components/DashboardContainer";
import { EventLogPanel } from "./components/EventLogPanel";
import type { DashboardConfig, LogEvent, AvailableFeatures } from "./types";
import "./styles/App.css";

const { useToken } = theme;

const themeConfig = {
  algorithm: theme.defaultAlgorithm,
};

const ThemedPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useToken();
  return (
    <div
      style={{
        height: "100%",
        backgroundColor: token.colorBgContainer,
        fontFamily: token.fontFamily,
      }}
    >
      {children}
    </div>
  );
};

const CONFIG_STORAGE_KEY = "superset-embedded-demo-config";

function App() {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [eventLog, setEventLog] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableFeatures, setAvailableFeatures] =
    useState<AvailableFeatures | null>(null);

  // Load saved config on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig) as DashboardConfig;
        // Check if all required fields are filled
        const isComplete = Boolean(
          parsedConfig.supersetFrontendDomain &&
            parsedConfig.supersetApiDomain &&
            parsedConfig.supersetUsername &&
            parsedConfig.supersetPassword &&
            parsedConfig.dashboardId &&
            parsedConfig.dashboardUuid
        );

        if (isComplete) {
          // Auto-apply if complete
          setConfig(parsedConfig);
        }
      }
    } catch (error) {
      console.error("Failed to load saved config:", error);
    }
  }, []);

  const handleApplyConfig = useCallback((newConfig: DashboardConfig) => {
    setLoading(true);
    setConfig(newConfig);
    setAvailableFeatures(null); // Reset features until new dashboard is embedded

    // Save config to localStorage
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.error("Failed to save config:", error);
    }

    setTimeout(() => setLoading(false), 500);
  }, []);

  const handleLogEvent = useCallback((event: LogEvent) => {
    setEventLog((prev) => [...prev.slice(-99), event]); // Keep last 100 events
  }, []);

  const handleClearLog = useCallback(() => {
    setEventLog([]);
  }, []);

  const handleFeaturesDetected = useCallback((features: AvailableFeatures) => {
    setAvailableFeatures(features);
  }, []);

  return (
    <div className="app-container">
      <PanelGroup direction="horizontal" className="panel-group">
        <Panel
          defaultSize={17}
          minSize={15}
          maxSize={40}
          className="panel side-panel"
        >
          <ConfigProvider theme={themeConfig}>
            <ThemedPanel>
              <ConfigPanel onApply={handleApplyConfig} loading={loading} />
            </ThemedPanel>
          </ConfigProvider>
        </Panel>

        <PanelResizeHandle className="resize-handle" />

        <Panel defaultSize={66} className="panel">
          <DashboardContainer
            config={config}
            onLogEvent={handleLogEvent}
            onFeaturesDetected={handleFeaturesDetected}
          />
        </Panel>

        <PanelResizeHandle className="resize-handle" />

        <Panel
          defaultSize={17}
          minSize={15}
          maxSize={40}
          className="panel side-panel"
        >
          <ConfigProvider theme={themeConfig}>
            <ThemedPanel>
              <EventLogPanel
                events={eventLog}
                onClear={handleClearLog}
                onLogEvent={handleLogEvent}
                availableFeatures={availableFeatures}
              />
            </ThemedPanel>
          </ConfigProvider>
        </Panel>
      </PanelGroup>
    </div>
  );
}

export default App;
