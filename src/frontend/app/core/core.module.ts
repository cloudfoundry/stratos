import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AuthGuardService } from './auth-guard.service';
import { ButtonBlurOnClickDirective } from './button-blur-on-click.directive';
import { BytesToHumanSize, MegaBytesToHumanSize } from './byte-formatters.pipe';
import { ClickStopPropagationDirective } from './click-stop-propagation';
import { CurrentUserPermissionsService } from './current-user-permissions.service';
import { Customizations } from './customizations.types';
import { DotContentComponent } from './dot-content/dot-content.component';
import { EndpointsService } from './endpoints.service';
import { EntityServiceFactory } from './entity-service-factory.service';
import { EventWatcherService } from './event-watcher/event-watcher.service';
import { InfinityPipe } from './infinity.pipe';
import { LogOutDialogComponent } from './log-out-dialog/log-out-dialog.component';
import { LoggerService } from './logger.service';
import { MDAppModule } from './md.module';
import { PageHeaderService } from './page-header-service/page-header.service';
import { PageNotFoundComponentComponent } from './page-not-found-component/page-not-found-component.component';
import { SafeImgPipe } from './safe-img.pipe';
import { TruncatePipe } from './truncate.pipe';
import { UserService } from './user.service';
import { UtilsService } from './utils.service';
import { WindowRef } from './window-ref/window-ref.service';


@NgModule({
  imports: [
    MDAppModule
  ],
  exports: [
    MDAppModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    LogOutDialogComponent,
    TruncatePipe,
    InfinityPipe,
    BytesToHumanSize,
    MegaBytesToHumanSize,
    SafeImgPipe,
    ClickStopPropagationDirective,
    DotContentComponent,
    ButtonBlurOnClickDirective,
    PageNotFoundComponentComponent
  ],
  providers: [
    AuthGuardService,
    PageHeaderService,
    EventWatcherService,
    WindowRef,
    UtilsService,
    LoggerService,
    EndpointsService,
    UserService,
    EntityServiceFactory,
    { provide: Customizations, useValue: {} },
    CurrentUserPermissionsService
  ],
  declarations: [
    LogOutDialogComponent,
    TruncatePipe,
    InfinityPipe,
    BytesToHumanSize,
    MegaBytesToHumanSize,
    SafeImgPipe,
    ClickStopPropagationDirective,
    DotContentComponent,
    ButtonBlurOnClickDirective,
    PageNotFoundComponentComponent
  ],
  entryComponents: [
    LogOutDialogComponent
  ],
})
export class CoreModule { }

