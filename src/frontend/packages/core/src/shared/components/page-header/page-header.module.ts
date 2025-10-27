import { NgModule } from '@angular/core';

import { CoreModule } from '../../../core/core.module';
import { ExtensionButtonsComponent } from '../extension-buttons/extension-buttons.component';
import { PageHeaderEventsComponent } from './page-header-events/page-header-events.component';
import { PageHeaderComponent } from './page-header.component';
import { ShowPageHeaderComponent } from './show-page-header/show-page-header.component';

@NgModule({
  imports: [
    CoreModule,
    PageHeaderEventsComponent, // Now standalone - moved to imports
  ],
  declarations: [
    ExtensionButtonsComponent,
    PageHeaderComponent,
    // PageHeaderEventsComponent, // Now standalone - moved to imports
    ShowPageHeaderComponent
  ],
  exports: [
    ExtensionButtonsComponent,
    PageHeaderComponent,
    PageHeaderEventsComponent, // Now standalone - kept in exports for backward compatibility
    ShowPageHeaderComponent
  ]
})
export class PageHeaderModule { }
