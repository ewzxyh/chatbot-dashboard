import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BotsSidebarComponent } from './bots-sidebar.component';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';



@NgModule({
  declarations: [
    BotsSidebarComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MatIconModule,
    MatTooltipModule,
  ], exports: [
    BotsSidebarComponent,
  ]
})
export class BotsSidebarModule { }
