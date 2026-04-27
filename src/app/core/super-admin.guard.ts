import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class SuperAdminGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private router: Router
  ) { }

  canActivate(): boolean {
    if (this.auth.isSuperAdmin) {
      return true;
    }
    this.router.navigate(['/projects']);
    return false;
  }
}
