import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AdminUsersComponent } from './admin-users.component';

describe('AdminUsersComponent user actions', () => {
  let adminService: jasmine.SpyObj<any>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let auth: jasmine.SpyObj<any>;
  let component: AdminUsersComponent;

  beforeEach(() => {
    adminService = jasmine.createSpyObj('AdminService', ['createUser', 'deleteUser', 'getUsers']);
    adminService.createUser.and.returnValue(of({}));
    adminService.deleteUser.and.returnValue(of({}));
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open', 'closeAll']);
    auth = jasmine.createSpyObj('AuthService', ['impersonate']);
    component = new AdminUsersComponent(adminService, dialog, auth);
    spyOn(component, 'loadUsers');
  });

  it('sends the admin create payload and keeps password out of component logs', () => {
    component.newUser = { name: 'Ana', email: 'redacted@example.invalid', password: 'senha simples' };

    component.createUser();

    expect(adminService.createUser).toHaveBeenCalledWith('Ana', 'redacted@example.invalid', 'senha simples');
    expect(component.loadUsers).toHaveBeenCalled();
    expect(component.successMessage).toBe('Usuário criado com sucesso.');
  });

  it('confirms deletion and calls the user endpoint without touching impersonation state', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const user = { _id: 'user-1', firstname: 'Ana', lastname: 'Silva', email: 'redacted@example.invalid' };

    component.deleteUser(user);

    expect(adminService.deleteUser).toHaveBeenCalledWith('user-1');
    expect(component.deletingUserId).toBeNull();
    expect(component.impersonatingTargetId).toBeNull();
    expect(component.loadUsers).toHaveBeenCalled();
  });

  it('rejects a password shorter than eight Unicode characters', () => {
    component.newUser = { name: 'Ana', email: 'redacted@example.invalid', password: '😀'.repeat(4) };

    component.createUser();

    expect(adminService.createUser).not.toHaveBeenCalled();
    expect(component.errorMessage).toBeTruthy();
  });
});
