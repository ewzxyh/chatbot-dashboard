import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/auth.service';
import { AdminService } from '../../services/admin.service';
import { unicodeCharacterLength, utf8ByteLength } from '../../utils/password-validator';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
  @ViewChild('createUserDialog', { static: true }) createUserDialogTemplate: TemplateRef<any>;

  users: any[] = [];
  displayedColumns = ['name', 'email', 'verified', 'projects', 'createdAt', 'actions'];
  totalCount = 0;
  page = 0;
  limit = 10;
  isLoading = true;
  errorMessage = '';
  searchText = '';
  impersonatingTargetId: string = null;
  impersonationError = '';
  newUser = { name: '', email: '', password: '' };
  createUserLoading = false;
  createUserError = '';
  deletingUserId: string = null;
  successMessage = '';

  constructor(private adminService: AdminService, private dialog: MatDialog, private auth: AuthService) { }
  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminService.getUsers(this.page, this.limit, this.searchText).subscribe(
      (res) => { this.users = res.data; this.totalCount = res.count; this.isLoading = false; },
      (err) => {
        console.error('[ADMIN-USERS] loadUsers error', err);
        this.errorMessage = 'Erro ao carregar usuários.';
        this.isLoading = false;
      }
    );
  }

  retry() { this.loadUsers(); }

  openCreateUserDialog() {
    this.newUser = { name: '', email: '', password: '' };
    this.createUserError = '';
    this.dialog.open(this.createUserDialogTemplate, {
      width: '480px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: false,
      panelClass: 'admin-dialog-panel'
    });
  }

  createUser() {
    const name = this.newUser.name.trim();
    const email = this.newUser.email.trim();
    const password = this.newUser.password;
    if (!name || !email || email.indexOf('@') === -1 || unicodeCharacterLength(password) < 8 || utf8ByteLength(password) > 72) {
      this.createUserError = 'Informe nome, e-mail e uma senha com 8 caracteres e no maximo 72 bytes.';
      return;
    }

    this.createUserLoading = true;
    this.createUserError = '';
    this.adminService.createUser(name, email, password).subscribe(
      () => {
        this.createUserLoading = false;
        this.dialog.closeAll();
        this.successMessage = 'Usuário criado com sucesso.';
        this.loadUsers();
      },
      (error) => {
        this.createUserLoading = false;
        this.createUserError = error && error.status === 409
          ? 'Já existe uma conta com este e-mail.'
          : 'Erro ao criar usuário.';
      }
    );
  }

  onSearch() { this.page = 0; this.loadUsers(); }
  onPageChange(event: any) { this.page = event.pageIndex; this.limit = event.pageSize; this.loadUsers(); }
  nextPage() { if ((this.page + 1) * this.limit < this.totalCount) { this.page++; this.loadUsers(); } }
  prevPage() { if (this.page > 0) { this.page--; this.loadUsers(); } }

  deleteUser(user: any) {
    if (!user || !user._id || this.deletingUserId) return;
    const userName = [user.firstname, user.lastname].filter(Boolean).join(' ') || user.email;
    if (!window.confirm('Excluir o usuário ' + userName + '?')) return;

    this.deletingUserId = user._id;
    this.errorMessage = '';
    this.adminService.deleteUser(user._id).subscribe(
      () => {
        this.deletingUserId = null;
        this.successMessage = 'Usuário excluído com sucesso.';
        this.loadUsers();
      },
      (error) => {
        this.deletingUserId = null;
        this.errorMessage = error && error.status === 409
          ? 'Este usuário é protegido ou ainda possui vínculos com projetos.'
          : 'Erro ao excluir usuário.';
      }
    );
  }

  impersonateUser(user: any) {
    if (!user || !user._id || this.impersonatingTargetId) return;
    const userName = [user.firstname, user.lastname].filter(Boolean).join(' ') || user.email;
    if (!window.confirm('Acessar o dashboard como ' + userName + '?')) return;

    this.impersonationError = '';
    this.impersonatingTargetId = user._id;
    this.auth.impersonate('user', user._id).subscribe(
      () => { },
      () => {
        this.impersonationError = 'Não foi possível acessar como este usuário.';
        this.impersonatingTargetId = null;
      }
    );
  }
}
