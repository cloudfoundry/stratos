import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { AuthGuardService } from './auth-guard.service';
import { EventWatcherService } from './event-watcher/event-watcher.service';
import { MDAppModule } from './md.module';
import { PageHeaderService } from './page-header-service/page-header.service';
import { UtilsService } from './utils.service';
import { WindowRef } from './window-ref/window-ref.service';
import { LogOutDialogComponent } from './log-out-dialog/log-out-dialog.component';

@NgModule({
  imports: [
    MDAppModule
  ],
  exports: [
    MDAppModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    LogOutDialogComponent
  ],
  providers: [
    AuthGuardService,
    PageHeaderService,
    EventWatcherService,
    WindowRef,
    UtilsService
  ],
  declarations: [LogOutDialogComponent],
  entryComponents: [
    LogOutDialogComponent
  ],
})
export class CoreModule { }
