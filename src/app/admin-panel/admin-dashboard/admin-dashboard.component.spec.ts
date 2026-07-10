import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  it('calcula os indicadores operacionais da base', () => {
    const component = new AdminDashboardComponent(null);
    component.stats = {
      totalProjects: 4,
      totalUsers: 10,
      monthlyRevenue: 500,
      planDistribution: { free: 1, starter: 0, pro: 3 }
    };

    expect(component.getUsersPerProject()).toBe(2.5);
    expect(component.getActivePlanCount()).toBe(2);
    expect(component.getPlanPercentage('pro')).toBe(75);
    expect(component.getLargestPlanKey()).toBe('pro');
  });

  it('resume o estado operacional sem recalcular o status do servidor', () => {
    const component = new AdminDashboardComponent(null);
    const overview = component.buildOperationalOverview({
      overallStatus: 'degraded',
      services: [{ status: 'ok' }, { status: 'down' }],
      channels: [{ status: 'ok' }],
      queues: { details: { queues: [{ status: 'ok', consumers: 1 }, { status: 'degraded', consumers: 1 }] } },
      alerts: [
        { severity: 'critical', type: 'webhook_failure' },
        { severity: 'warning', type: 'queue_backlog' }
      ]
    }, {
      events: { byStatus: { failed: 3 }, byLevel: { error: 2 } },
      alerts: { byType: { webhook_failure: 1 } }
    });

    expect(overview.status).toBe('degraded');
    expect(overview.servicesOk).toBe(1);
    expect(overview.queuesOk).toBe(1);
    expect(overview.failures24h).toBe(3);
    expect(overview.webhookFailures24h).toBe(1);
    expect(overview.criticalAlerts).toBe(1);
  });
});
