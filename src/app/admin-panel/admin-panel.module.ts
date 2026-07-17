import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AdminPanelComponent } from './admin-panel.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AdminProjectsComponent } from './admin-projects/admin-projects.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { AdminPaymentsComponent } from './admin-payments/admin-payments.component';
import { AdminOperationComponent } from './admin-operation/admin-operation.component';
import { AdminAuditComponent } from './admin-audit/admin-audit.component';
import { AdminPrivacyComponent } from './admin-privacy/admin-privacy.component';
import { AdminUazapiComponent } from './admin-uazapi/admin-uazapi.component';

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
      { path: 'uazapi', component: AdminUazapiComponent },
      { path: 'privacy', component: AdminPrivacyComponent },
    ]
  }
];

function ptBrPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Itens por página';
  intl.nextPageLabel = 'Próxima página';
  intl.previousPageLabel = 'Página anterior';
  intl.firstPageLabel = 'Primeira página';
  intl.lastPageLabel = 'Última página';
  intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) return '0 de ' + length;
    const start = page * pageSize;
    const end = Math.min(start + pageSize, length);
    return (start + 1) + ' - ' + end + ' de ' + length;
  };
  return intl;
}

@NgModule({
  declarations: [
    AdminPanelComponent,
    AdminDashboardComponent,
    AdminProjectsComponent,
    AdminUsersComponent,
    AdminPaymentsComponent,
    AdminOperationComponent,
    AdminAuditComponent,
    AdminUazapiComponent,
    AdminPrivacyComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTableModule,
    MatTabsModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    { provide: MatPaginatorIntl, useFactory: ptBrPaginatorIntl }
  ]
})
export class AdminPanelModule { }
