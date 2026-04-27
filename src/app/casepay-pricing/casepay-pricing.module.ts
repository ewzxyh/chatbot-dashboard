import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CasepayPricingComponent } from './casepay-pricing.component';

const routes: Routes = [
  { path: '', component: CasepayPricingComponent }
];

@NgModule({
  declarations: [CasepayPricingComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    RouterModule.forChild(routes)
  ]
})
export class CasepayPricingModule { }
