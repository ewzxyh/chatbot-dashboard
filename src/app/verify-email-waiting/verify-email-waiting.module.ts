import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { VerifyEmailWaitingComponent } from './verify-email-waiting.component';

const routes: Routes = [
  { path: '', component: VerifyEmailWaitingComponent }
];

@NgModule({
  declarations: [VerifyEmailWaitingComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    RouterModule.forChild(routes)
  ]
})
export class VerifyEmailWaitingModule { }
