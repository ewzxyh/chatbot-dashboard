import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CasezapSharedModule } from './casezap-shared.module';
import { CasezapComponent } from './casezap.component';

const routes: Routes = [
  { path: '', component: CasezapComponent }
];

@NgModule({
  imports: [
    CasezapSharedModule,
    RouterModule.forChild(routes)
  ]
})
export class CasezapModule { }
