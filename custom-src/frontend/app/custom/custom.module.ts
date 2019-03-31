import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutoscalerTabExtensionComponent } from './autoscaler-tab-extension/autoscaler-tab-extension.component';
import { SharedModule } from '../shared/shared.module';
import { MDAppModule } from '../core/md.module';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    MDAppModule,
    NgxChartsModule
  ],
  declarations: [AutoscalerTabExtensionComponent],
  entryComponents: [AutoscalerTabExtensionComponent]
})
export class CustomModule { }
