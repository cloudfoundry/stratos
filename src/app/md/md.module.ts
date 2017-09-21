import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
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
    MdSelectModule,
    MdGridListModule,
    MdTableModule,
    MdToolbarModule,
    MdProgressBarModule
} from '@angular/material';

const importExport = [
    BrowserAnimationsModule,
    MdButtonModule,
    MdCheckboxModule,
    MdInputModule,
    MdCardModule,
    MdProgressSpinnerModule,
    MdSidenavModule,
    MdTabsModule,
    MdIconModule,
    MdSelectModule,
    MdGridListModule,
    MdTableModule,
    MdToolbarModule,
    MdProgressBarModule
];

@NgModule({
    imports: importExport,
    exports: importExport,
})
export class MDAppModule { }
