import { NgModule } from '@angular/core';

import { CoreModule } from '../../../core/core.module';
import { PageHeaderComponent } from './page-header.component';
import { PageSubheaderComponent } from '../page-subheader/page-subheader.component';
import { PageHeaderEventsComponent } from './page-header-events/page-header-events.component';
import { ExtensionButtonsComponent } from '../extension-buttons/extension-buttons.component';


@NgModule({
  imports: [
    CoreModule
  ],
  declarations: [
    ExtensionButtonsComponent,
    PageSubheaderComponent,
    PageHeaderComponent,
    PageHeaderEventsComponent,
  ],
  exports: [
    ExtensionButtonsComponent,
    PageSubheaderComponent,
    PageHeaderComponent,
  ]
})
export class PageHeaderModule { }
