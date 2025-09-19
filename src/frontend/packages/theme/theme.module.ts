import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { StratosThemeService } from './theme.service';
import { CompanyConfigService } from './company-config.service';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    StratosThemeService,
    CompanyConfigService
  ]
})
export class StratosThemeModule { }