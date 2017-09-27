import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { ApplicationsRoutingModule } from './applications.routing';

import { ApplicationBaseComponent } from './application/application-base.component';
import { EventsTabComponent } from './application/events-tab/events-tab.component';
import { LogStreamTabComponent } from './application/log-stream-tab/log-stream-tab.component';
import { ServicesTabComponent } from './application/services-tab/services-tab.component';
import { SshTabComponent } from './application/ssh-tab/ssh-tab.component';
import { SummaryTabComponent } from './application/summary-tab/summary-tab.component';
import { VariablesTabComponent } from './application/variables-tab/variables-tab.component';
import { ApplicationWallComponent } from './application-wall/application-wall.component';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { ViewBuildpackComponent } from './application/summary-tab/view-buildpack/view-buildpack.component';


@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    ApplicationsRoutingModule
  ],
  declarations: [
    ApplicationWallComponent,
    ApplicationBaseComponent,
    EventsTabComponent,
    LogStreamTabComponent,
    ServicesTabComponent,
    SshTabComponent,
    SummaryTabComponent,
    VariablesTabComponent,
    ViewBuildpackComponent
  ]
})
export class ApplicationsModule { }
