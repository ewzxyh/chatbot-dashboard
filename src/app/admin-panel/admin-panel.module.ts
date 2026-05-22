import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AdminPanelComponent } from './admin-panel.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AdminProjectsComponent } from './admin-projects/admin-projects.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { AdminPaymentsComponent } from './admin-payments/admin-payments.component';
import { AdminOperationComponent } from './admin-operation/admin-operation.component';
import { AdminAuditComponent } from './admin-audit/admin-audit.component';
import { AdminPrivacyComponent } from './admin-privacy/admin-privacy.component';

const routes: Routes = [
  {
    path: '',
    component: AdminPanelComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'projects', component: AdminProjectsComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'payments', component: AdminPaymentsComponent },
      { path: 'operation', component: AdminOperationComponent },
      { path: 'audit', component: AdminAuditComponent },
      { path: 'privacy', component: AdminPrivacyComponent },
    ]
  }
];

@NgModule({
  declarations: [
    AdminPanelComponent,
    AdminDashboardComponent,
    AdminProjectsComponent,
    AdminUsersComponent,
    AdminPaymentsComponent,
    AdminOperationComponent,
    AdminAuditComponent,
    AdminPrivacyComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class AdminPanelModule { }
