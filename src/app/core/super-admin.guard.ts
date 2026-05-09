import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { AppConfigService } from '../services/app-config.service';

@Injectable()
export class SuperAdminGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private router: Router,
    private httpClient: HttpClient,
    private appConfigService: AppConfigService
  ) { }

  canActivate(): boolean | Observable<boolean> {
    if (this.auth.isSuperAdmin) {
      return true;
    }

    const user = this.auth.user_bs.value || this.getStoredUser();
    if (!user || !user.token) {
      this.router.navigate(['/login']);
      return false;
    }

    const url = this.appConfigService.getConfig().SERVER_BASE_URL + 'sadmin/stats';
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': user.token
      })
    };

    return this.httpClient.get<any>(url, httpOptions).pipe(
      map(() => {
        localStorage.setItem('superadmin_role', 'admin');
        return true;
      }),
      catchError((error) => {
        if (error && error.status === 401) {
          this.router.navigate(['/login']);
        } else {
          this.router.navigate(['/projects']);
        }
        return of(false);
      })
    );
  }

  private getStoredUser(): any {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      return null;
    }
  }
}
