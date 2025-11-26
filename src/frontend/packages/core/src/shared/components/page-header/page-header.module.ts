import { NgModule } from '@angular/core';

import { CoreModule } from '../../../core/core.module';
import { ExtensionButtonsComponent } from '../extension-buttons/extension-buttons.component';
import { PageHeaderEventsComponent } from './page-header-events/page-header-events.component';
import { PageHeaderComponent } from './page-header.component';
import { ShowPageHeaderComponent } from './show-page-header/show-page-header.component';

// This module is deprecated - use the standalone components directly instead
// Kept for backward compatibility with test files only
@NgModule({
  imports: [
    CoreModule,
    PageHeaderEventsComponent,
    ExtensionButtonsComponent,
    PageHeaderComponent,
    ShowPageHeaderComponent
  ],
  exports: [
    ExtensionButtonsComponent,
    PageHeaderComponent,
    PageHeaderEventsComponent,
    ShowPageHeaderComponent
  ]
})
export class PageHeaderModule { }
