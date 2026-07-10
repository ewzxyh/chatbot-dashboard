import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { AdminPrivacyComponent } from './admin-privacy.component';

describe('AdminPrivacyComponent input contracts', () => {
  it('mantém todos os inputs no contrato de alinhamento vertical', async () => {
    const adminService = jasmine.createSpyObj<AdminService>('AdminService', [
      'getPrivacyConfig',
      'getPrivacyRetentionStatus'
    ]);
    adminService.getPrivacyConfig.and.returnValue(of({
      config: {
        conversationRetentionDays: 30,
        attachmentRetentionDays: 30,
        leadRetentionDays: 30,
        auditEventRetentionDays: 30
      }
    }));
    adminService.getPrivacyRetentionStatus.and.returnValue(of({ counts: {}, job: {} }));

    await TestBed.configureTestingModule({
      declarations: [AdminPrivacyComponent],
      imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        NoopAnimationsModule
      ],
      providers: [{ provide: AdminService, useValue: adminService }]
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminPrivacyComponent);
    fixture.detectChanges();
    const inputs = Array.from(fixture.nativeElement.querySelectorAll('.privacy-form input')) as HTMLInputElement[];

    expect(inputs.length).toBe(4);
    for (const input of inputs) {
      const inputStyle = getComputedStyle(input);

      expect(input.classList.contains('privacy-aligned-input')).toBe(true);
      expect(input.closest('.mat-form-field-appearance-outline')).not.toBeNull();
      expect(inputStyle.lineHeight).toBe('24px');
      expect(inputStyle.marginTop).toBe('0px');
      expect(inputStyle.marginRight).toBe('0px');
      expect(inputStyle.marginBottom).toBe('0px');
      expect(inputStyle.marginLeft).toBe('0px');
      expect(input.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    }
  });
});
