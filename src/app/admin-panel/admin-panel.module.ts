import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AdminPanelComponent } from './admin-panel.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AdminProjectsComponent } from './admin-projects/admin-projects.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { AdminPaymentsComponent } from './admin-payments/admin-payments.component';

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
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class AdminPanelModule { }
