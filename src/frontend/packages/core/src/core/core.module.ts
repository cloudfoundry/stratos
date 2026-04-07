import { PortalModule } from '@angular/cdk/portal';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { PaginationMonitorFactory, EntityCatalogHelper, EntityServiceFactory, EntityMonitorFactory } from '@stratosui/store';

// Tailwind Material Replacements
import { TailwindDialogService, TailwindDialogRef, TailwindDialogRefImpl } from '../shared/services/tailwind-dialog.service';
import { TailwindSnackBarService } from '../shared/services/tailwind-snackbar.service';
import { TailwindErrorStateMatcher } from '../shared/services/tailwind-error-state-matcher';

import { RecentEntitiesComponent } from '../shared/components/recent-entities/recent-entities.component';
import { ButtonBlurOnClickDirective } from './button-blur-on-click.directive';
import { BytesToHumanSize, MegaBytesToHumanSize } from './byte-formatters.pipe';
import { ClickStopPropagationDirective } from './click-stop-propagation.directive';
import { APP_TITLE, appTitleFactory } from './core.types';
import { DotContentComponent } from './dot-content/dot-content.component';
import { EndpointsService } from './endpoints.service';
import { EntityFavoriteStarComponent } from './entity-favorite-star/entity-favorite-star.component';
import { EventWatcherService } from './event-watcher/event-watcher.service';
import { InfinityPipe } from './infinity.pipe';
import { LogOutDialogComponent } from './log-out-dialog/log-out-dialog.component';
import { MDAppModule } from './md.module';
import { PageHeaderService } from './page-header-service/page-header.service';
import { PageNotFoundComponentComponent } from './page-not-found-component/page-not-found-component.component';
import { SafeImgPipe } from './safe-img.pipe';
import { ShowHideButtonComponent } from './show-hide-button/show-hide-button.component';
import { StatefulIconComponent } from './stateful-icon/stateful-icon.component';
import { TruncatePipe } from './truncate.pipe';

import { UserService } from './user.service';
import { UtilsService } from './utils.service';
import { WindowRef } from './window-ref/window-ref.service';

@NgModule({
    imports: [
        MDAppModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        PortalModule,
        // All standalone components, directives, and pipes
        ClickStopPropagationDirective,
        EntityFavoriteStarComponent,
        RecentEntitiesComponent,
        BytesToHumanSize,
        MegaBytesToHumanSize,
        LogOutDialogComponent,
        StatefulIconComponent,
        ShowHideButtonComponent,
        DotContentComponent,
        PageNotFoundComponentComponent,
        TruncatePipe,
        InfinityPipe,
        SafeImgPipe,
        ButtonBlurOnClickDirective,
    ],
    exports: [
        MDAppModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        PortalModule,
        // Re-export standalone components, directives, and pipes
        LogOutDialogComponent,
        TruncatePipe,
        InfinityPipe,
        BytesToHumanSize,
        MegaBytesToHumanSize,
        SafeImgPipe,
        ClickStopPropagationDirective,
        DotContentComponent,
        ButtonBlurOnClickDirective,
        PageNotFoundComponentComponent,
        EntityFavoriteStarComponent,
        RecentEntitiesComponent,
        StatefulIconComponent,
        ShowHideButtonComponent
    ],
    providers: [
        // Note: Most services already use providedIn: 'root' and don't need to be provided here
        // Keeping only services that require special configuration or don't use providedIn
        EntityCatalogHelper,
        PaginationMonitorFactory,
        {
            provide: APP_TITLE,
            useFactory: appTitleFactory,
            deps: [Title]
        },
        // Tailwind Material service providers (these don't use providedIn: 'root')
        TailwindDialogService,
        TailwindSnackBarService,
        TailwindErrorStateMatcher
    ]
})
export class CoreModule {
  constructor() { }

}

