import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CasezapComponent } from './casezap.component';

const routes: Routes = [
  { path: '', component: CasezapComponent }
];

@NgModule({
  declarations: [CasezapComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    RouterModule.forChild(routes)
  ]
})
export class CasezapModule { }
