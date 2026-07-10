import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
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

  constructor(private adminService: AdminService, private auth: AuthService) { }
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

  onSearch() { this.page = 0; this.loadUsers(); }
  onPageChange(event: any) { this.page = event.pageIndex; this.limit = event.pageSize; this.loadUsers(); }
  nextPage() { if ((this.page + 1) * this.limit < this.totalCount) { this.page++; this.loadUsers(); } }
  prevPage() { if (this.page > 0) { this.page--; this.loadUsers(); } }

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
