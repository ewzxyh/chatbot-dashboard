import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { AdminService } from '../../services/admin.service';
import { AdminProjectsComponent } from './admin-projects.component';

describe('AdminProjectsComponent dialog contracts', () => {
  let adminService: jasmine.SpyObj<AdminService>;

  beforeEach(async () => {
    adminService = jasmine.createSpyObj<AdminService>('AdminService', [
      'getProjects',
      'getBillingLifecycleJobStatus'
    ]);
    adminService.getProjects.and.returnValue(of({ data: [], count: 0 }));
    adminService.getBillingLifecycleJobStatus.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      declarations: [AdminProjectsComponent],
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
        { provide: AuthService, useValue: jasmine.createSpyObj<AuthService>('AuthService', ['impersonate']) }
      ]
    }).compileComponents();
  });

  afterEach(() => TestBed.inject(MatDialog).closeAll());

  it('abre o dialog com overlay responsivo e controls legíveis', () => {
    const fixture = TestBed.createComponent(AdminProjectsComponent);
    fixture.detectChanges();

    fixture.componentInstance.openPlanModal({ _id: 'project-1', name: 'Projeto' });
    fixture.detectChanges();

    const panel = document.body.querySelector('.admin-dialog-panel') as HTMLElement;
    expect(panel).not.toBeNull();
    expect(panel.querySelector('.admin-dialog-title')).not.toBeNull();
    expect(panel.querySelector('.admin-dialog-field')).not.toBeNull();
    expect(panel.querySelector('.admin-dialog-control')).not.toBeNull();
  });
});
