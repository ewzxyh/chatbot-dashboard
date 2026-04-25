import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { WorkspaceNameComponent } from './workspace-name.component';

const routes: Routes = [
  { path: '', component: WorkspaceNameComponent }
];

@NgModule({
  declarations: [WorkspaceNameComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    RouterModule.forChild(routes)
  ]
})
export class WorkspaceNameModule { }
