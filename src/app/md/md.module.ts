import { NgModule } from '@angular/core';
import {
    MdButtonModule,
    MdCheckboxModule,
    MdInputModule,
    MdCardModule,
    MdProgressSpinnerModule,
    MdSidenavModule,
    MdTabsModule,
    MdIconModule,
} from '@angular/material';

const importExport = [
    MdButtonModule,
    MdCheckboxModule,
    MdInputModule,
    MdCardModule,
    MdProgressSpinnerModule,
    MdSidenavModule,
    MdTabsModule,
    MdIconModule
];

@NgModule({
    imports: importExport,
    exports: importExport,
})
export class MDAppModule { }
