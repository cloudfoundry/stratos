import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AuthGuardService } from './auth-guard.service';
import { EventWatcherService } from './event-watcher/event-watcher.service';
import { MDAppModule } from './md.module';
import { PageHeaderService } from './page-header-service/page-header.service';
import { WindowRef } from './window-ref/window-ref.service';
import { UtilsService } from './utils.service';

@NgModule({
  imports: [
    MDAppModule
  ],
  exports: [
    MDAppModule,
    RouterModule
  ],
  providers: [
    AuthGuardService,
    PageHeaderService,
    EventWatcherService,
    WindowRef,
    UtilsService
  ]
})
export class CoreModule { }
