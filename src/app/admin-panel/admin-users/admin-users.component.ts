import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  displayedColumns = ['name', 'email', 'verified', 'projects', 'createdAt'];
  totalCount = 0;
  page = 0;
  limit = 10;
  isLoading = true;
  searchText = '';

  constructor(private adminService: AdminService) { }
  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.isLoading = true;
    this.adminService.getUsers(this.page, this.limit, this.searchText).subscribe(
      (res) => { this.users = res.data; this.totalCount = res.count; this.isLoading = false; },
      (err) => { console.error('[ADMIN-USERS] loadUsers error', err); this.isLoading = false; }
    );
  }

  onSearch() { this.page = 0; this.loadUsers(); }
  onPageChange(event: any) { this.page = event.pageIndex; this.limit = event.pageSize; this.loadUsers(); }
  nextPage() { if ((this.page + 1) * this.limit < this.totalCount) { this.page++; this.loadUsers(); } }
  prevPage() { if (this.page > 0) { this.page--; this.loadUsers(); } }
}
