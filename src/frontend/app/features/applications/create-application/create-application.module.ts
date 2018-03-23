import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Store } from '@ngrx/store';

import { CoreModule } from '../../../core/core.module';
import { CfOrgSpaceDataService, CfOrgSpaceSelectMode } from '../../../shared/data-services/cf-org-space-service.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { SharedModule } from '../../../shared/shared.module';
import { AppState } from '../../../store/app-state';
import { AppNameUniqueDirective } from '../app-name-unique.directive/app-name-unique.directive';
import { CreateApplicationStep1Component } from './create-application-step1/create-application-step1.component';
import { CreateApplicationStep2Component } from './create-application-step2/create-application-step2.component';
import { CreateApplicationStep3Component } from './create-application-step3/create-application-step3.component';
import { CreateApplicationComponent } from './create-application.component';

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    SharedModule
  ],
  declarations: [
    CreateApplicationComponent,
    CreateApplicationStep1Component,
    CreateApplicationStep2Component,
    CreateApplicationStep3Component,
    AppNameUniqueDirective
  ],
  exports: [
    CreateApplicationComponent,
    CreateApplicationStep1Component
  ],
  providers: [
    {
      provide: CfOrgSpaceDataService,
      useFactory: (store: Store<AppState>, paginationMonitorFactory: PaginationMonitorFactory) => {
        return new CfOrgSpaceDataService(store, paginationMonitorFactory, CfOrgSpaceSelectMode.ANY, false);
      },
      deps: [Store, PaginationMonitorFactory]
    }
  ]
})
export class CreateApplicationModule { }
