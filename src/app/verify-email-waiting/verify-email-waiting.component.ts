import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { UsersService } from '../services/users.service';

@Component({
  selector: 'appdashboard-verify-email-waiting',
  templateUrl: './verify-email-waiting.component.html',
  styleUrls: ['./verify-email-waiting.component.scss']
})
export class VerifyEmailWaitingComponent implements OnInit, OnDestroy {

  userEmail: string = '';
  userId: string = '';
  verificationCode: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  isResending: boolean = false;

  private userSub: Subscription;

  constructor(
    private auth: AuthService,
    private usersService: UsersService,
    private router: Router
  ) { }

  ngOnInit() {
    this.userSub = this.auth.user_bs.subscribe((user) => {
      if (!user) {
        setTimeout(() => {
          if (!this.auth.user_bs.value) this.router.navigate(['/signup']);
        }, 1000);
        return;
      }
      if (user.emailverified) {
        this.router.navigate(['/workspace-name']);
        return;
      }
      this.userEmail = user.email;
      this.userId = user._id;
    });
  }

  ngOnDestroy() {
    if (this.userSub) this.userSub.unsubscribe();
  }

  verifyCode() {
    if (!this.verificationCode || this.verificationCode.length < 4) {
      this.errorMessage = 'Digite o código enviado para seu email.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';

    this.auth.emailVerify(this.userId, this.verificationCode).subscribe(
      (res: any) => {
        this.isLoading = false;
        const updatedUser = this.auth.user_bs.value;
        if (updatedUser) {
          updatedUser.emailverified = true;
          this.auth.publishUpdatedUser(updatedUser);
        }
        this.router.navigate(['/workspace-name']);
      },
      (err) => {
        this.isLoading = false;
        const errorCode = err && err.error && err.error.error_code;
        switch (errorCode) {
          case 10005:
            this.errorMessage = 'O código expirou ou é inválido. Clique em "Reenviar email".';
            break;
          case 10006:
            this.errorMessage = 'Este código pertence a outra conta.';
            break;
          case 10004:
            this.errorMessage = 'Código não fornecido.';
            break;
          default:
            this.errorMessage = 'Código inválido. Verifique e tente novamente.';
        }
      }
    );
  }

  resendEmail() {
    this.isResending = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.usersService.resendVerifyEmail().subscribe(
      (res: any) => {
        this.isResending = false;
        this.successMessage = 'Email reenviado com sucesso!';
      },
      (err) => {
        this.isResending = false;
        this.errorMessage = 'Erro ao reenviar. Tente novamente.';
      }
    );
  }
}
