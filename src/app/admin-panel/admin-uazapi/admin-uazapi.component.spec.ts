import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import type { AdminService, UazapiAccount } from '../../services/admin.service';
import { AdminUazapiComponent } from './admin-uazapi.component';

const account: UazapiAccount = {
  id: 1,
  name: 'Conta principal',
  subdomain: 'principal',
  acceptsNewInstances: true,
  hasAdminToken: true,
  tokenLastFour: '1234',
  instanceCount: 2,
  createdAt: '2026-07-17T12:00:00.000Z',
  updatedAt: '2026-07-17T12:00:00.000Z'
};

describe('AdminUazapiComponent', () => {
  let adminService: jasmine.SpyObj<AdminService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let component: AdminUazapiComponent;

  beforeEach(() => {
    adminService = jasmine.createSpyObj<AdminService>('AdminService', [
      'getUazapiAccounts',
      'createUazapiAccount',
      'updateUazapiAccount',
      'deleteUazapiAccount',
      'testUazapiAccount'
    ]);
    adminService.getUazapiAccounts.and.returnValue(of({ accounts: [], maxAccounts: 3 }));
    adminService.createUazapiAccount.and.returnValue(of({}));
    adminService.updateUazapiAccount.and.returnValue(of({}));
    adminService.deleteUazapiAccount.and.returnValue(of({}));
    adminService.testUazapiAccount.and.returnValue(of({ ok: true, instanceCount: 0 }));
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open', 'closeAll']);
    component = new AdminUazapiComponent(adminService, dialog);
  });

  it('carrega o limite retornado pela API e desabilita novas contas ao atingi-lo', () => {
    adminService.getUazapiAccounts.and.returnValue(of({
      accounts: [account, { ...account, id: 2 }, { ...account, id: 3 }],
      maxAccounts: 3
    }));

    component.ngOnInit();

    expect(component.accounts.length).toBe(3);
    expect(component.maxAccounts).toBe(3);
    expect(component.isAtLimit).toBe(true);
  });

  it('exige token na criação e envia os campos sem espaços externos', () => {
    component.accountForm = {
      name: ' Conta principal ',
      subdomain: ' principal ',
      adminToken: ' token-secreto ',
      acceptsNewInstances: true
    };

    component.saveAccount();

    expect(adminService.createUazapiAccount).toHaveBeenCalledWith({
      name: 'Conta principal',
      subdomain: 'principal',
      adminToken: 'token-secreto',
      acceptsNewInstances: true
    });
    expect(dialog.closeAll).toHaveBeenCalled();
  });

  it('preserva o token atual quando a edição deixa o campo vazio', () => {
    component.openEditDialog(account);
    component.accountForm.name = 'Conta editada';

    component.saveAccount();

    expect(component.accountForm.adminToken).toBe('');
    expect(adminService.updateUazapiAccount).toHaveBeenCalledWith(1, {
      name: 'Conta editada',
      subdomain: 'principal',
      acceptsNewInstances: true
    });
  });

  it('atualiza a contagem após testar a conexão', () => {
    const testedAccount = { ...account };
    adminService.testUazapiAccount.and.returnValue(of({ ok: true, instanceCount: 5 }));

    component.testAccount(testedAccount);

    expect(adminService.testUazapiAccount).toHaveBeenCalledWith(1);
    expect(testedAccount.instanceCount).toBe(5);
    expect(component.successMessage).toContain('5 instâncias encontradas');
  });

  it('confirma antes de excluir uma conta', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    component.deleteAccount(account);

    expect(window.confirm).toHaveBeenCalledWith('Excluir a conta UAZAPI Conta principal?');
    expect(adminService.deleteUazapiAccount).toHaveBeenCalledWith(1);
  });
});
