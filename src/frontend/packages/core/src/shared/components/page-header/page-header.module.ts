import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { CoreModule } from '../../../core/core.module';
import { ExtensionButtonsComponent } from '../extension-buttons/extension-buttons.component';
import { PageHeaderEventsComponent } from './page-header-events/page-header-events.component';
import { PageHeaderComponent } from './page-header.component';
import { ShowPageHeaderComponent } from './show-page-header/show-page-header.component';

@NgModule({
  imports: [
    CoreModule,
    HttpClientModule,
  ],
  declarations: [
    ExtensionButtonsComponent,
    PageHeaderComponent,
    PageHeaderEventsComponent,
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
