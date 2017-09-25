import { NgModule } from '@angular/core';

import { CoreModule } from '../../../core/core.module';
import { PageHeaderComponent } from './page-header.component';


@NgModule({
    imports: [
        CoreModule
    ],
    declarations: [
        PageHeaderComponent
    ],
    exports: [
        PageHeaderComponent
    ]
})
export class PageHeaderModule { }
