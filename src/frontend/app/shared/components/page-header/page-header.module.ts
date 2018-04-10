import { NgModule } from '@angular/core';

import { CoreModule } from '../../../core/core.module';
import { PageHeaderComponent } from './page-header.component';
import { PageSubheaderComponent } from '../page-subheader/page-subheader.component';


@NgModule({
    imports: [
        CoreModule
    ],
    declarations: [
        PageSubheaderComponent,
        PageHeaderComponent,
    ],
    exports: [
        PageSubheaderComponent,
        PageHeaderComponent,
    ]
})
export class PageHeaderModule { }
