import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CasezapComponent } from './casezap.component';

@NgModule({
  declarations: [CasezapComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule
  ],
  exports: [CasezapComponent]
})
export class CasezapSharedModule { }
