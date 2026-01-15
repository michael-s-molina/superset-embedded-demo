import { Form, Input, Button, Tooltip, Typography, Collapse, theme } from "antd";
import { QuestionCircleOutlined, CheckCircleFilled } from "@ant-design/icons";
import Editor from "@monaco-editor/react";
import type { DashboardConfig } from "../types";
import { useState, useEffect } from "react";

const { Title } = Typography;
const { useToken } = theme;

interface ConfigPanelProps {
  onApply: (config: DashboardConfig) => void;
  loading: boolean;
}

const DEFAULT_UI_CONFIG = JSON.stringify(
  {
    hideTitle: false,
    hideTab: false,
    hideChartControls: false,
    emitDataMasks: true,
    filters: {
      visible: true,
      expanded: true,
    },
  },
  null,
  2
);

const DEFAULT_RLS = "[]";

const MONACO_EDITOR_OPTIONS = {
  minimap: { enabled: false },
  lineNumbers: "off" as const,
  scrollBeyondLastLine: false,
  folding: false,
  fontSize: 12,
  padding: { top: 8, bottom: 8 },
  glyphMargin: false,
  lineDecorationsWidth: 8,
  lineNumbersMinChars: 0,
  renderLineHighlight: "none" as const,
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  overviewRulerBorder: false,
  guides: {
    indentation: false,
    bracketPairs: false,
  },
};

const LabelWithTooltip = ({
  label,
  tooltip,
  secondaryColor,
}: {
  label: string;
  tooltip: string;
  secondaryColor: string;
}) => (
  <span>
    {label}{" "}
    <Tooltip title={tooltip}>
      <QuestionCircleOutlined style={{ color: secondaryColor, cursor: "help" }} />
    </Tooltip>
  </span>
);

const SectionHeader = ({
  title,
  isComplete,
  successColor,
}: {
  title: string;
  isComplete: boolean;
  successColor: string;
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <span>{title}</span>
    {isComplete && (
      <CheckCircleFilled style={{ color: successColor, fontSize: 14 }} />
    )}
  </div>
);

const CONFIG_STORAGE_KEY = "superset-embedded-demo-config";

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  onApply,
  loading,
}) => {
  const { token } = useToken();
  const [form] = Form.useForm();

  // Initialize state from localStorage
  const [domainsComplete, setDomainsComplete] = useState(false);
  const [credentialsComplete, setCredentialsComplete] = useState(false);
  const [dashboardComplete, setDashboardComplete] = useState(false);

  const [uiConfigValue, setUiConfigValue] = useState(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        const config = JSON.parse(saved);
        return config.uiConfig || DEFAULT_UI_CONFIG;
      }
    } catch (error) {
      console.error("Failed to load saved config:", error);
    }
    return DEFAULT_UI_CONFIG;
  });

  const [rlsValue, setRlsValue] = useState(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        const config = JSON.parse(saved);
        return config.rls || DEFAULT_RLS;
      }
    } catch (error) {
      console.error("Failed to load saved config:", error);
    }
    return DEFAULT_RLS;
  });

  // Get initial form values from localStorage or defaults
  const getInitialValues = () => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Failed to load saved config:", error);
    }
    return {
      supersetFrontendDomain: "http://localhost:9000",
      supersetApiDomain: "http://localhost:8088",
      supersetUsername: "",
      supersetPassword: "",
      dashboardId: "",
      dashboardUuid: "",
      rls: DEFAULT_RLS,
      uiConfig: DEFAULT_UI_CONFIG,
      permalinkDomain: "",
    };
  };

  // Update validation state when form values change
  const updateValidationState = (values: Record<string, unknown>) => {
    const {
      supersetFrontendDomain,
      supersetApiDomain,
      supersetUsername,
      supersetPassword,
      dashboardId,
      dashboardUuid,
    } = values;
    setDomainsComplete(Boolean(supersetFrontendDomain && supersetApiDomain));
    setCredentialsComplete(Boolean(supersetUsername && supersetPassword));
    setDashboardComplete(Boolean(dashboardId && dashboardUuid));
  };

  // Initialize validation state after form mounts
  useEffect(() => {
    const values = form.getFieldsValue();
    if (values && Object.keys(values).length > 0) {
      updateValidationState(values);
    }
  }, [form]);

  const allRequiredComplete = domainsComplete && credentialsComplete && dashboardComplete;

  const handleSubmit = (values: {
    supersetFrontendDomain: string;
    supersetApiDomain: string;
    supersetUsername: string;
    supersetPassword: string;
    dashboardId: string;
    dashboardUuid: string;
    rls: string;
    uiConfig: string;
    permalinkDomain?: string;
  }) => {
    onApply({
      supersetFrontendDomain: values.supersetFrontendDomain.replace(/\/$/, ""),
      supersetApiDomain: values.supersetApiDomain.replace(/\/$/, ""),
      supersetUsername: values.supersetUsername,
      supersetPassword: values.supersetPassword,
      dashboardId: values.dashboardId,
      dashboardUuid: values.dashboardUuid,
      rls: values.rls || DEFAULT_RLS,
      uiConfig: values.uiConfig || DEFAULT_UI_CONFIG,
      permalinkDomain: values.permalinkDomain?.replace(/\/$/, "") || undefined,
    });
  };

  const collapseItems = [
    {
      key: "domains",
      forceRender: true,
      label: (
        <SectionHeader
          title="Domains"
          isComplete={domainsComplete}
          successColor={token.colorSuccess}
        />
      ),
      children: (
        <>
          <Form.Item
            name="supersetFrontendDomain"
            label={
              <LabelWithTooltip
                label="Superset Frontend Domain"
                tooltip="The URL where Superset frontend is running (e.g., http://localhost:9000). This is where the dashboard iframe will load from."
                secondaryColor={token.colorTextSecondary}
              />
            }
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="http://localhost:9000" />
          </Form.Item>

          <Form.Item
            name="supersetApiDomain"
            label={
              <LabelWithTooltip
                label="Superset API Domain"
                tooltip="The URL where Superset backend API is running (e.g., http://localhost:8088). This is where guest tokens will be requested from."
                secondaryColor={token.colorTextSecondary}
              />
            }
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="http://localhost:8088" />
          </Form.Item>

          <Form.Item
            name="permalinkDomain"
            label={
              <LabelWithTooltip
                label="Permalink Domain"
                tooltip="Domain used for resolving dashboard permalinks. Defaults to Superset API Domain if left empty."
                secondaryColor={token.colorTextSecondary}
              />
            }
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="Superset API Domain" />
          </Form.Item>
        </>
      ),
    },
    {
      key: "credentials",
      forceRender: true,
      label: (
        <SectionHeader
          title="Credentials"
          isComplete={credentialsComplete}
          successColor={token.colorSuccess}
        />
      ),
      children: (
        <>
          <Form.Item
            name="supersetUsername"
            label={
              <LabelWithTooltip
                label="Username"
                tooltip="Username for authentication with Superset API"
                secondaryColor={token.colorTextSecondary}
              />
            }
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="admin" />
          </Form.Item>

          <Form.Item
            name="supersetPassword"
            label={
              <LabelWithTooltip
                label="Password"
                tooltip="Password for authentication with Superset API"
                secondaryColor={token.colorTextSecondary}
              />
            }
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input.Password placeholder="password" />
          </Form.Item>
        </>
      ),
    },
    {
      key: "dashboard",
      forceRender: true,
      label: <SectionHeader title="Dashboard" isComplete={dashboardComplete} successColor={token.colorSuccess} />,
      children: (
        <>
          <Form.Item
            name="dashboardId"
            label={
              <LabelWithTooltip
                label="Dashboard Embed ID"
                tooltip="The embed ID from Superset's embed configuration UI"
                secondaryColor={token.colorTextSecondary}
              />
            }
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="abc123-def456-..." />
          </Form.Item>

          <Form.Item
            name="dashboardUuid"
            label={
              <LabelWithTooltip
                label="Dashboard UUID"
                tooltip="The dashboard UUID used for guest token resource access"
                secondaryColor={token.colorTextSecondary}
              />
            }
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="abc123-def456-..." />
          </Form.Item>
        </>
      ),
    },
    {
      key: "advanced",
      forceRender: true,
      label: <SectionHeader title="Advanced" isComplete={true} successColor={token.colorSuccess} />,
      children: (
        <>
          <Form.Item
            name="uiConfig"
            label={
              <LabelWithTooltip
                label="Dashboard UI Config"
                tooltip="SDK dashboardUiConfig options as JSON object"
                secondaryColor={token.colorTextSecondary}
              />
            }
            style={{ marginBottom: 12 }}
          >
            <div
              style={{
                border: `1px solid ${token.colorBorder}`,
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <Editor
                height="200px"
                defaultLanguage="json"
                value={uiConfigValue}
                onChange={(value) => {
                  setUiConfigValue(value || DEFAULT_UI_CONFIG);
                  form.setFieldValue("uiConfig", value);
                }}
                options={MONACO_EDITOR_OPTIONS}
              />
            </div>
          </Form.Item>

          <Form.Item
            name="rls"
            label={
              <LabelWithTooltip
                label="RLS Rules"
                tooltip={
                  'Row-level security rules as JSON array. Example: [{ "clause": "country = \'USA\'" }]'
                }
                secondaryColor={token.colorTextSecondary}
              />
            }
            style={{ marginBottom: 12 }}
          >
            <div
              style={{
                border: `1px solid ${token.colorBorder}`,
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <Editor
                height="200px"
                defaultLanguage="json"
                value={rlsValue}
                onChange={(value) => {
                  setRlsValue(value || DEFAULT_RLS);
                  form.setFieldValue("rls", value);
                }}
                options={MONACO_EDITOR_OPTIONS}
              />
            </div>
          </Form.Item>
        </>
      ),
    },
  ];

  return (
    <div style={{ height: "100%", overflow: "auto", padding: 16 }}>
      <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
        Configuration
      </Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={(_, allValues) => updateValidationState(allValues)}
        initialValues={getInitialValues()}
        size="small"
        style={
          {
            "--ant-form-item-label-padding-bottom": "2px",
          } as React.CSSProperties
        }
        className="compact-form"
      >
        <Collapse
          accordion
          defaultActiveKey="domains"
          items={collapseItems}
        />

        <Form.Item style={{ marginTop: 16 }}>
          <Tooltip
            title={
              !allRequiredComplete
                ? "Please complete all required sections (Domains, Credentials, and Dashboard)"
                : ""
            }
          >
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={!allRequiredComplete}
              block
              style={{ width: "100%" }}
            >
              Apply Configuration
            </Button>
          </Tooltip>
        </Form.Item>
      </Form>
    </div>
  );
};
