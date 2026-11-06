import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { StratosBrandingService } from './stratos-branding.service';

@NgModule({
  imports: [CommonModule, HttpClientModule],
  providers: [StratosBrandingService]
})
export class StratosThemeModule { }
