import { useRef, useEffect, useState, useCallback } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";
import { Spin, Alert, Typography } from "antd";
import type {
  DashboardConfig,
  LogEvent,
  AvailableFeatures,
  EmbeddedDashboardInstance,
} from "../types";
import { fetchGuestToken } from "../services/api";

const { Text } = Typography;

interface DashboardContainerProps {
  config: DashboardConfig | null;
  onLogEvent: (event: LogEvent) => void;
  onFeaturesDetected: (features: AvailableFeatures) => void;
}

// Feature detection function
const detectFeatures = (
  dashboard: EmbeddedDashboardInstance
): AvailableFeatures => ({
  hasObserveDataMask: typeof dashboard.observeDataMask === "function",
  hasGetDataMask: typeof dashboard.getDataMask === "function",
  hasGetChartStates: typeof dashboard.getChartStates === "function",
  hasGetActiveTabs: typeof dashboard.getActiveTabs === "function",
  hasGetScrollSize: typeof dashboard.getScrollSize === "function",
  hasSetThemeMode: typeof dashboard.setThemeMode === "function",
  hasSetThemeConfig: typeof dashboard.setThemeConfig === "function",
  hasGetDashboardPermalink:
    typeof dashboard.getDashboardPermalink === "function",
  hasUnmount: typeof dashboard.unmount === "function",
});

export const DashboardContainer: React.FC<DashboardContainerProps> = ({
  config,
  onLogEvent,
  onFeaturesDetected,
}) => {
  const mountPointRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<EmbeddedDashboardInstance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLogEvent = useCallback(
    (type: LogEvent["type"], data: unknown): LogEvent => ({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      data,
    }),
    []
  );

  useEffect(() => {
    if (!config || !mountPointRef.current) return;

    const embed = async () => {
      setLoading(true);
      setError(null);

      try {
        // Unmount previous dashboard if exists
        if (dashboardRef.current?.unmount) {
          try {
            dashboardRef.current.unmount();
          } catch {
            // Silently ignore unmount errors
          }
          dashboardRef.current = null;
        }

        // Clear the mount point
        if (mountPointRef.current) {
          mountPointRef.current.innerHTML = "";
        }

        // Parse RLS rules
        let rlsRules: Array<{ clause: string }> = [];
        if (config.rls && config.rls.trim() !== "") {
          try {
            rlsRules = JSON.parse(config.rls);
          } catch (e) {
            onLogEvent(
              createLogEvent("error", {
                message: "Invalid RLS JSON",
                error: String(e),
              })
            );
          }
        }

        // Parse UI config
        let uiConfig: Record<string, unknown> = {};
        if (config.uiConfig && config.uiConfig.trim() !== "") {
          try {
            uiConfig = JSON.parse(config.uiConfig);
          } catch (e) {
            onLogEvent(
              createLogEvent("error", {
                message: "Invalid UI Config JSON",
                error: String(e),
              })
            );
          }
        }

        // Always ensure emitDataMasks is enabled for cross-filter events
        if (!("emitDataMasks" in uiConfig)) {
          uiConfig.emitDataMasks = true;
        }

        // Create guest token fetcher
        // Credentials are optional - when JWT auth is enabled on the server,
        // they're not needed (the server gets user identity from headers)
        const getGuestToken = async () => {
          onLogEvent(
            createLogEvent("info", { message: "Fetching guest token..." })
          );

          const token = await fetchGuestToken({
            dashboardId: config.dashboardId,
            rls: rlsRules,
            // Only include credentials if provided (not needed with JWT auth)
            supersetApiDomain: config.supersetApiDomain,
            supersetUsername: config.supersetUsername,
            supersetPassword: config.supersetPassword,
          });

          onLogEvent(
            createLogEvent("info", {
              message: "Guest token fetched successfully",
            })
          );
          return token;
        };

        // Create permalink URL resolver function
        // The SDK passes a { key } object and expects a full URL back
        const resolvePermalinkUrl = async ({
          key,
        }: {
          key: string;
        }): Promise<string> => {
          const targetDomain =
            config.permalinkDomain || config.supersetApiDomain;
          return `${targetDomain}/superset/dashboard/p/${key}/`;
        };

        onLogEvent(
          createLogEvent("info", {
            message: "Embedding dashboard...",
            uiConfig,
            permalinkDomain: config.permalinkDomain || config.supersetApiDomain,
          })
        );

        // Embed dashboard (uses Frontend domain)
        // Note: resolvePermalinkUrl may not be in all SDK versions, so we cast to handle this
        const embedOptions: Parameters<typeof embedDashboard>[0] & { resolvePermalinkUrl?: typeof resolvePermalinkUrl } = {
          id: config.dashboardId,
          supersetDomain: config.supersetFrontendDomain,
          mountPoint: mountPointRef.current!,
          fetchGuestToken: getGuestToken,
          dashboardUiConfig: uiConfig,
          resolvePermalinkUrl,
        };
        const dashboard = (await embedDashboard(embedOptions as Parameters<typeof embedDashboard>[0])) as EmbeddedDashboardInstance;

        dashboardRef.current = dashboard;

        // Detect available features
        const features = detectFeatures(dashboard);
        onFeaturesDetected(features);

        // Log feature availability
        onLogEvent(
          createLogEvent("features", {
            message: "SDK features detected",
            features,
          })
        );

        // Set up event listeners (if available)
        if (features.hasObserveDataMask && dashboard.observeDataMask) {
          dashboard.observeDataMask((dataMask) => {
            onLogEvent(createLogEvent("dataMask", dataMask));
          });
        }

        // Apply theme mode if available (default = light theme)
        if (features.hasSetThemeMode && dashboard.setThemeMode) {
          dashboard.setThemeMode("default");
          onLogEvent(
            createLogEvent("info", {
              message: "Theme mode set to default (light)",
            })
          );
        }

        onLogEvent(
          createLogEvent("info", { message: "Dashboard embedded successfully" })
        );

        // Configure iframe scrolling
        const iframe = mountPointRef.current?.querySelector("iframe");
        if (iframe) {
          iframe.setAttribute("scrolling", "auto");
          // Try to hide horizontal scrollbar via CSS
          (iframe as HTMLIFrameElement).style.overflowX = "hidden";
          (iframe as HTMLIFrameElement).style.overflowY = "auto";
        }

        // Expose dashboard instance to window for debugging
        (
          window as unknown as { supersetDashboard: EmbeddedDashboardInstance }
        ).supersetDashboard = dashboard;
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to embed dashboard";
        setError(errorMessage);
        onLogEvent(
          createLogEvent("error", {
            message: errorMessage,
            stack: err instanceof Error ? err.stack : undefined,
          })
        );
      } finally {
        setLoading(false);
      }
    };

    embed();

    // Cleanup on unmount
    return () => {
      if (dashboardRef.current?.unmount) {
        try {
          dashboardRef.current.unmount();
        } catch {
          // Silently ignore unmount errors
        }
      }
    };
  }, [config, onLogEvent, onFeaturesDetected, createLogEvent]);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflowX: "hidden",
        overflowY: "hidden",
      }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: 24,
            borderRadius: 8,
          }}
        >
          <Spin size="large" tip="Loading dashboard..." />
        </div>
      )}

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ margin: 16 }}
        />
      )}

      {!config && !loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <Text type="secondary">
            Configure and apply settings to embed a dashboard
          </Text>
        </div>
      )}

      <div
        ref={mountPointRef}
        style={{
          flex: 1,
          width: "100%",
          display: config ? "block" : "none",
          overflowX: "hidden",
          overflowY: "auto",
        }}
      />
    </div>
  );
};
