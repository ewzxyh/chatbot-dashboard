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
});
