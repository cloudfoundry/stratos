import { NgModule } from '@angular/core';

import { CoreModule } from '../../../core/core.module';
import { ExtensionButtonsComponent } from '../extension-buttons/extension-buttons.component';
import { PageSubheaderComponent } from '../page-subheader/page-subheader.component';
import { PageHeaderEventsComponent } from './page-header-events/page-header-events.component';
import { PageHeaderComponent } from './page-header.component';


@NgModule({
  imports: [
    CoreModule,
  ],
  declarations: [
    ExtensionButtonsComponent,
    PageSubheaderComponent,
    PageHeaderComponent,
    PageHeaderEventsComponent
  ],
  exports: [
    ExtensionButtonsComponent,
    PageSubheaderComponent,
    PageHeaderComponent,
    PageHeaderEventsComponent
  ]
})
export class PageHeaderModule { }
