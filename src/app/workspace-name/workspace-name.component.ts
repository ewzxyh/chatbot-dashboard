import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { ProjectService } from '../services/project.service';

@Component({
  selector: 'appdashboard-workspace-name',
  templateUrl: './workspace-name.component.html',
  styleUrls: ['./workspace-name.component.scss']
})
export class WorkspaceNameComponent implements OnInit, OnDestroy {

  workspaceName: string = '';
  errorMessage: string = '';
  isLoading: boolean = true;

  private userSub: Subscription;

  constructor(
    private auth: AuthService,
    private projectService: ProjectService,
    private router: Router
  ) { }

  ngOnInit() {
    this.userSub = this.auth.user_bs.subscribe((user) => {
      if (!user) {
        this.router.navigate(['/signup']);
        return;
      }
      if (!user.emailverified) {
        this.router.navigate(['/verify-email-waiting']);
        return;
      }

      this.projectService.getProjects().subscribe(
        (projects: any[]) => {
          this.isLoading = false;
          if (projects && projects.length > 0) {
            this.router.navigate(['/projects']);
          }
        },
        (err) => {
          this.isLoading = false;
        }
      );
    });
  }

  ngOnDestroy() {
    if (this.userSub) this.userSub.unsubscribe();
  }

  createWorkspace() {
    const name = this.workspaceName.trim();
    if (!name || name.length < 2) {
      this.errorMessage = 'Digite o nome da sua empresa (mínimo 2 caracteres).';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.projectService.createProject(name, 'signup').subscribe(
      (project: any) => {
        this.isLoading = false;
        this.auth.projectSelected(project, 'workspace-name');
        this.projectService.newProjectCreated(true);
        this.router.navigate(['/project/' + project._id + '/home']);
      },
      (err) => {
        this.isLoading = false;
        this.errorMessage = 'Erro ao criar workspace. Tente novamente.';
      }
    );
  }
}
