import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  AdminService,
  UazapiAccount
} from '../../services/admin.service';

interface UazapiAccountForm {
  name: string;
  subdomain: string;
  adminToken: string;
  acceptsNewInstances: boolean;
}

@Component({
  selector: 'app-admin-uazapi',
  templateUrl: './admin-uazapi.component.html',
  styleUrls: ['./admin-uazapi.component.scss']
})
export class AdminUazapiComponent implements OnInit {
  @ViewChild('accountDialog', { static: true }) accountDialogTemplate: TemplateRef<any>;

  readonly displayedColumns = ['name', 'subdomain', 'status', 'createdAt', 'instances', 'actions'];
  accounts: UazapiAccount[] = [];
  maxAccounts = 3;
  isLoading = true;
  isSaving = false;
  busyAccountId: number = null;
  errorMessage = '';
  successMessage = '';
  formError = '';
  editingAccount: UazapiAccount = null;
  accountForm: UazapiAccountForm = this.emptyForm();

  constructor(private adminService: AdminService, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.loadAccounts();
  }

  get isAtLimit(): boolean {
    return this.accounts.length >= this.maxAccounts;
  }

  loadAccounts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminService.getUazapiAccounts().subscribe(
      (response) => {
        this.accounts = response.accounts;
        this.maxAccounts = response.maxAccounts;
        this.isLoading = false;
      },
      () => {
        this.errorMessage = 'Não foi possível carregar as contas UAZAPI.';
        this.isLoading = false;
      }
    );
  }

  openCreateDialog(): void {
    if (this.isAtLimit) return;
    this.editingAccount = null;
    this.accountForm = this.emptyForm();
    this.openDialog();
  }

  openEditDialog(account: UazapiAccount): void {
    this.editingAccount = account;
    this.accountForm = {
      name: account.name,
      subdomain: account.subdomain,
      adminToken: '',
      acceptsNewInstances: account.acceptsNewInstances
    };
    this.openDialog();
  }

  saveAccount(): void {
    const name = this.accountForm.name.trim();
    const subdomain = this.accountForm.subdomain.trim();
    const adminToken = this.accountForm.adminToken.trim();
    if (!name || !subdomain || (!this.editingAccount && !adminToken)) {
      this.formError = this.editingAccount
        ? 'Informe o nome e o subdomínio.'
        : 'Informe o nome, o subdomínio e o token administrativo.';
      return;
    }

    this.isSaving = true;
    this.formError = '';
    const basePayload = {
      name,
      subdomain,
      acceptsNewInstances: this.accountForm.acceptsNewInstances
    };
    const request = this.editingAccount
      ? this.adminService.updateUazapiAccount(
        this.editingAccount.id,
        adminToken ? { ...basePayload, adminToken } : basePayload
      )
      : this.adminService.createUazapiAccount({ ...basePayload, adminToken });

    request.subscribe(
      () => {
        this.isSaving = false;
        this.dialog.closeAll();
        this.successMessage = this.editingAccount
          ? 'Conta UAZAPI atualizada com sucesso.'
          : 'Conta UAZAPI adicionada com sucesso.';
        this.loadAccounts();
      },
      (error) => {
        this.isSaving = false;
        this.formError = this.getSaveError(error);
      }
    );
  }

  testAccount(account: UazapiAccount): void {
    if (this.busyAccountId) return;
    this.busyAccountId = account.id;
    this.errorMessage = '';
    this.adminService.testUazapiAccount(account.id).subscribe(
      (response) => {
        account.instanceCount = response.instanceCount;
        this.busyAccountId = null;
        const instanceLabel = response.instanceCount === 1 ? 'instância encontrada' : 'instâncias encontradas';
        this.successMessage = 'Conexão validada: ' + response.instanceCount + ' ' + instanceLabel + '.';
      },
      () => {
        this.busyAccountId = null;
        this.errorMessage = 'Não foi possível conectar a esta conta UAZAPI. Verifique o subdomínio e o token.';
      }
    );
  }

  deleteAccount(account: UazapiAccount): void {
    if (this.busyAccountId || !window.confirm('Excluir a conta UAZAPI ' + account.name + '?')) return;
    this.busyAccountId = account.id;
    this.errorMessage = '';
    this.adminService.deleteUazapiAccount(account.id).subscribe(
      () => {
        this.busyAccountId = null;
        this.successMessage = 'Conta UAZAPI excluída com sucesso.';
        this.loadAccounts();
      },
      (error) => {
        this.busyAccountId = null;
        this.errorMessage = error && error.status === 409
          ? 'Esta conta não pode ser excluída enquanto estiver vinculada a instâncias.'
          : 'Não foi possível excluir a conta UAZAPI.';
      }
    );
  }

  private openDialog(): void {
    this.formError = '';
    this.dialog.open(this.accountDialogTemplate, {
      width: '520px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: false,
      panelClass: 'admin-dialog-panel'
    });
  }

  private emptyForm(): UazapiAccountForm {
    return { name: '', subdomain: '', adminToken: '', acceptsNewInstances: true };
  }

  private getSaveError(error: any): string {
    if (error && error.status === 409) {
      return !this.editingAccount && this.isAtLimit
        ? 'O limite de contas UAZAPI foi atingido.'
        : 'Já existe uma conta com este subdomínio.';
    }
    if (error && error.status === 400) return 'Revise os dados informados e tente novamente.';
    return this.editingAccount
      ? 'Não foi possível atualizar a conta UAZAPI.'
      : 'Não foi possível adicionar a conta UAZAPI.';
  }
}
