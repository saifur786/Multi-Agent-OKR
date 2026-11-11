/**
 * Planview Anvi Asynchronous Event Bus
 * Facilitates decoupled pub/sub event delivery between the Supervisor Agent
 * and Worker Agents across all 6 stages of the OKR lifecycle.
 */

import { BusEvent, EventTopic } from '../types/orchestration';

type EventListener = (event: BusEvent) => void;

class AsyncEventBus {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private eventHistory: BusEvent[] = [];
  private maxHistory: number = 80;

  /**
   * Subscribe to specific event topic or '*' for all events.
   */
  public subscribe(topic: EventTopic | '*', listener: EventListener): () => void {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    this.listeners.get(topic)!.add(listener);

    // Return un-subscribe function
    return () => {
      const set = this.listeners.get(topic);
      if (set) {
        set.delete(listener);
      }
    };
  }

  /**
   * Publish an event onto the asynchronous event bus.
   */
  public publish(event: Omit<BusEvent, 'id' | 'timestamp'>): BusEvent {
    const fullEvent: BusEvent = {
      ...event,
      id: 'evt-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };

    // Store in history
    this.eventHistory = [fullEvent, ...this.eventHistory].slice(0, this.maxHistory);

    // Dispatch asynchronously to simulate real bus behavior
    setTimeout(() => {
      // Notify topic-specific listeners
      const specificListeners = this.listeners.get(fullEvent.topic);
      if (specificListeners) {
        specificListeners.forEach((listener) => {
          try {
            listener(fullEvent);
          } catch (err) {
            console.error('Error in event bus listener', err);
          }
        });
      }

      // Notify wildcard listeners
      const wildcardListeners = this.listeners.get('*');
      if (wildcardListeners) {
        wildcardListeners.forEach((listener) => {
          try {
            listener(fullEvent);
          } catch (err) {
            console.error('Error in wildcard event bus listener', err);
          }
        });
      }
    }, fullEvent.latencyMs || 25);

    return fullEvent;
  }

  /**
   * Get all recorded events.
   */
  public getHistory(): BusEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Clear event history.
   */
  public clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Pre-seed the event bus with initial operational events for an industry.
   */
  public seedInitialEvents(industryName: string): BusEvent[] {
    const now = new Date();
    const formatTime = (offsetSec: number) => {
      const d = new Date(now.getTime() - offsetSec * 1000);
      return d.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };

    const initial: BusEvent[] = [
      {
        id: 'evt-init-06',
        timestamp: formatTime(4),
        topic: 'EXECUTIVE_PAYLOAD_COMPILED',
        sourceAgent: 'Executive Reporting Agent',
        targetAgent: 'Anvi React Dashboard',
        summary: `Aggregated 18 KRs and $42.5M capital allocation into Board telemetry payload for ${industryName}`,
        payload: { status: 'compiled', metricsCount: 24, deliveryChannel: 'REST /api/v2/executive-scorecard' },
        latencyMs: 18,
        severity: 'success'
      },
      {
        id: 'evt-init-05',
        timestamp: formatTime(18),
        topic: 'RISK_SENTINEL_ALERT',
        sourceAgent: 'Risk Detection Agent',
        targetAgent: 'Supervisor Agent',
        summary: 'Pacing anomaly: Mortgage Automation KR projected at 62% attainment (-18% variance)',
        payload: { trigger: 'webhook:jira_sprint_dip', anomalySeverity: 'High', squadImpact: 'Credit Engine Backend' },
        latencyMs: 32,
        severity: 'danger'
      },
      {
        id: 'evt-init-04',
        timestamp: formatTime(42),
        topic: 'SQUAD_OVERALLOCATION_FLAGGED',
        sourceAgent: 'Alignment & Capacity Agent',
        targetAgent: 'Supervisor Agent',
        summary: 'Capacity breach: Credit Engine Backend squad load at 108% (12 FTE allocated vs 11 capacity)',
        payload: { squad: 'Credit Engine Backend', loadPct: 108, recommendedShift: 'Reallocate 2 devs from Branch Ops' },
        latencyMs: 22,
        severity: 'warning'
      },
      {
        id: 'evt-init-03',
        timestamp: formatTime(75),
        topic: 'ORPHAN_EPIC_DETECTED',
        sourceAgent: 'Alignment & Capacity Agent',
        targetAgent: 'Supervisor Agent',
        summary: 'Detected 3 orphan Epics ($1.8M spend) with 0 OKR alignment',
        payload: { unalignedCapex: '$1.8M', orphanedIds: ['b-p1-legacy', 'b-p9-reporting'] },
        latencyMs: 15,
        severity: 'warning'
      },
      {
        id: 'evt-init-02',
        timestamp: formatTime(110),
        topic: 'KR_REGRESSION_PREDICTED',
        sourceAgent: 'OKR Quality & Prediction Agent',
        targetAgent: 'Supervisor Agent',
        summary: 'Regression model calibrated: 81% probability of attainment for 48h mortgage SLA KR',
        payload: { rSquared: 0.88, slope: 1.14, stretchFactor: 1.25 },
        latencyMs: 44,
        severity: 'info'
      },
      {
        id: 'evt-init-01',
        timestamp: formatTime(150),
        topic: 'STRATEGY_RAG_QUERIED',
        sourceAgent: 'Strategy & Ideation Agent',
        targetAgent: 'Vector Knowledge Base',
        summary: 'Executed RAG vector similarity search over APRA CPS 230 and historical Q1-Q3 attainment vectors',
        payload: { vectorDistance: 0.14, topMatches: 5, domain: industryName },
        latencyMs: 62,
        severity: 'info'
      }
    ];

    this.eventHistory = initial;
    return initial;
  }
}

export const eventBus = new AsyncEventBus();
