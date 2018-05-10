import { NgModule } from '@angular/core';

import { CoreModule } from '../../../core/core.module';
import { PageHeaderComponent } from './page-header.component';
import { PageSubheaderComponent } from '../page-subheader/page-subheader.component';
import { PageHeaderEventsComponent } from './page-header-events/page-header-events.component';


@NgModule({
  imports: [
    CoreModule
  ],
  declarations: [
    PageSubheaderComponent,
    PageHeaderComponent,
    PageHeaderEventsComponent,
  ],
  exports: [
    PageSubheaderComponent,
    PageHeaderComponent,
  ]
})
export class PageHeaderModule { }
