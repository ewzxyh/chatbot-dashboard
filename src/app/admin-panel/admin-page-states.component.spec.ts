import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { AdminService } from '../services/admin.service';
import { AdminPaymentsComponent } from './admin-payments/admin-payments.component';
import { AdminProjectsComponent } from './admin-projects/admin-projects.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';

function expectOnlyErrorState(root: HTMLElement): void {
  expect(root.querySelector('[role="alert"]')).not.toBeNull();
  expect(root.querySelector('table')).toBeNull();
  expect(root.querySelector('mat-paginator')).toBeNull();
  expect(root.querySelector('.admin-empty-state')).toBeNull();
}

describe('Admin list initial error states', () => {
  let adminService: jasmine.SpyObj<AdminService>;

  beforeEach(async () => {
    adminService = jasmine.createSpyObj<AdminService>('AdminService', [
      'getProjects',
      'getBillingLifecycleJobStatus',
      'getUsers',
      'getPayments'
    ]);
    adminService.getProjects.and.returnValue(throwError(new Error('projects unavailable')));
    adminService.getBillingLifecycleJobStatus.and.returnValue(of({}));
    adminService.getUsers.and.returnValue(throwError(new Error('users unavailable')));
    adminService.getPayments.and.returnValue(throwError(new Error('payments unavailable')));
    spyOn(console, 'error');

    await TestBed.configureTestingModule({
      declarations: [AdminProjectsComponent, AdminUsersComponent, AdminPaymentsComponent],
      imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatCardModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatPaginatorModule,
        MatSelectModule,
        MatTableModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AdminService, useValue: adminService },
        { provide: AuthService, useValue: jasmine.createSpyObj<AuthService>('AuthService', ['impersonate']) },
        { provide: MatDialog, useValue: jasmine.createSpyObj<MatDialog>('MatDialog', ['open', 'closeAll']) }
      ]
    }).compileComponents();
  });

  it('Projects mostra somente o erro quando a carga inicial falha', () => {
    const fixture = TestBed.createComponent(AdminProjectsComponent);
    fixture.detectChanges();
    expectOnlyErrorState(fixture.nativeElement);
  });

  it('Users mostra somente o erro quando a carga inicial falha', () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    fixture.detectChanges();
    expectOnlyErrorState(fixture.nativeElement);
  });

  it('Payments mostra somente o erro quando a carga inicial falha', () => {
    const fixture = TestBed.createComponent(AdminPaymentsComponent);
    fixture.detectChanges();
    expectOnlyErrorState(fixture.nativeElement);
  });
});
