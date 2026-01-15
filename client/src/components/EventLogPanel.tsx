import { useEffect, useRef, useCallback, useState } from 'react';
import { Button, Space, Tag, Tooltip, Typography, theme } from 'antd';
import { ClearOutlined, DownloadOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import type { LogEvent, AvailableFeatures, EmbeddedDashboardInstance } from '../types';

const { Text, Title } = Typography;
const { useToken } = theme;

interface EventLogPanelProps {
  events: LogEvent[];
  onClear: () => void;
  onLogEvent: (event: LogEvent) => void;
  availableFeatures: AvailableFeatures | null;
}

const getTypeColor = (type: LogEvent['type']): string => {
  switch (type) {
    case 'error': return 'red';
    case 'info': return 'blue';
    case 'dataMask': return 'green';
    case 'chartStates': return 'purple';
    case 'activeTabs': return 'orange';
    case 'scrollSize': return 'cyan';
    case 'features': return 'gold';
    default: return 'default';
  }
};

export const EventLogPanel: React.FC<EventLogPanelProps> = ({
  events,
  onClear,
  onLogEvent,
  availableFeatures,
}) => {
  const { token } = useToken();
  const logEndRef = useRef<HTMLDivElement>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const toggleEvent = useCallback((eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }, []);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(events, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `superset-events-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [events]);

  const createLogEvent = useCallback((
    type: LogEvent['type'],
    data: unknown
  ): LogEvent => ({
    id: crypto.randomUUID(),
    timestamp: new Date(),
    type,
    data,
  }), []);

  const safeCall = useCallback(async <T,>(
    fn: () => Promise<T>,
    methodName: string
  ): Promise<T | null> => {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      onLogEvent(createLogEvent('error', {
        message: `${methodName} failed`,
        error: String(error)
      }));
      return null;
    }
  }, [onLogEvent, createLogEvent]);

  const callSdkMethod = useCallback(async <T,>(
    methodName: keyof EmbeddedDashboardInstance,
    eventType: LogEvent['type'],
    args: unknown[] = []
  ) => {
    const dashboard = (window as unknown as { supersetDashboard?: EmbeddedDashboardInstance }).supersetDashboard;
    const method = dashboard?.[methodName];
    if (method && typeof method === 'function') {
      const result = await safeCall(
        () => (method as (...args: unknown[]) => Promise<T>)(...args),
        String(methodName)
      );
      if (result !== null) {
        onLogEvent(createLogEvent(eventType, eventType === 'info' ? { permalink: result } : result));
      }
    }
  }, [safeCall, onLogEvent, createLogEvent]);

  const handleGetDataMask = useCallback(() => callSdkMethod('getDataMask', 'dataMask'), [callSdkMethod]);
  const handleGetChartStates = useCallback(() => callSdkMethod('getChartStates', 'chartStates'), [callSdkMethod]);
  const handleGetActiveTabs = useCallback(() => callSdkMethod('getActiveTabs', 'activeTabs'), [callSdkMethod]);
  const handleGetScrollSize = useCallback(() => callSdkMethod('getScrollSize', 'scrollSize'), [callSdkMethod]);
  const handleGetPermalink = useCallback(() => callSdkMethod('getDashboardPermalink', 'info', ['']), [callSdkMethod]);

  const hasNoDashboard = !availableFeatures;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={5} style={{ marginTop: 0, marginBottom: 0 }}>Event Log</Title>
        <Space size="small">
          <Tooltip title="Export events as JSON">
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              size="small"
              disabled={events.length === 0}
            />
          </Tooltip>
          <Tooltip title="Clear all events">
            <Button
              icon={<ClearOutlined />}
              onClick={onClear}
              size="small"
              danger
              disabled={events.length === 0}
            />
          </Tooltip>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>SDK Methods</Text>
        <Space wrap size="small">
            <Tooltip title={hasNoDashboard ? 'Embed a dashboard first' : !availableFeatures?.hasGetDataMask ? 'Not available in this SDK version' : 'Get current filter state'}>
              <Button
                type="primary"
                onClick={handleGetDataMask}
                size="small"
                disabled={hasNoDashboard || !availableFeatures?.hasGetDataMask}
              >
                getDataMask
              </Button>
            </Tooltip>
            <Tooltip title={hasNoDashboard ? 'Embed a dashboard first' : !availableFeatures?.hasGetChartStates ? 'Not available in this SDK version' : 'Get all chart states'}>
              <Button
                type="primary"
                onClick={handleGetChartStates}
                size="small"
                disabled={hasNoDashboard || !availableFeatures?.hasGetChartStates}
              >
                getChartStates
              </Button>
            </Tooltip>
            <Tooltip title={hasNoDashboard ? 'Embed a dashboard first' : !availableFeatures?.hasGetActiveTabs ? 'Not available in this SDK version' : 'Get active tab names'}>
              <Button
                type="primary"
                onClick={handleGetActiveTabs}
                size="small"
                disabled={hasNoDashboard || !availableFeatures?.hasGetActiveTabs}
              >
                getActiveTabs
              </Button>
            </Tooltip>
            <Tooltip title={hasNoDashboard ? 'Embed a dashboard first' : !availableFeatures?.hasGetScrollSize ? 'Not available in this SDK version' : 'Get dashboard dimensions'}>
              <Button
                type="primary"
                onClick={handleGetScrollSize}
                size="small"
                disabled={hasNoDashboard || !availableFeatures?.hasGetScrollSize}
              >
                getScrollSize
              </Button>
            </Tooltip>
          <Tooltip title={hasNoDashboard ? 'Embed a dashboard first' : !availableFeatures?.hasGetDashboardPermalink ? 'Not available in this SDK version' : 'Get permalink URL'}>
            <Button
              type="primary"
              onClick={handleGetPermalink}
              size="small"
              disabled={hasNoDashboard || !availableFeatures?.hasGetDashboardPermalink}
            >
              getPermalink
            </Button>
          </Tooltip>
        </Space>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Text type="secondary">No events yet</Text>
          </div>
        ) : (
          events.map((event) => {
            const isExpanded = expandedEvents.has(event.id);
            return (
              <div
                key={event.id}
                style={{
                  marginBottom: 8,
                  padding: 8,
                  backgroundColor: token.colorBgContainer,
                  borderRadius: token.borderRadius,
                  fontSize: 11,
                  border: `1px solid ${token.colorBorder}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleEvent(event.id)}
                >
                  {isExpanded ? (
                    <DownOutlined style={{ fontSize: 10, color: token.colorTextSecondary }} />
                  ) : (
                    <RightOutlined style={{ fontSize: 10, color: token.colorTextSecondary }} />
                  )}
                  <Tag color={getTypeColor(event.type)} style={{ margin: 0, fontSize: 10 }}>
                    {event.type}
                  </Tag>
                  <span style={{ color: token.colorTextSecondary, fontSize: 10 }}>
                    {event.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                {isExpanded && (
                  <pre style={{
                    margin: 0,
                    marginTop: 8,
                    marginLeft: 18,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: 10,
                    color: token.colorText,
                    fontFamily: token.fontFamilyCode,
                  }}>
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                )}
              </div>
            );
          })
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};
