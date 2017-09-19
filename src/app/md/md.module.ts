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
    MdFormFieldModule,
} from '@angular/material';
import { CommonModule } from '@angular/common';

const importExport = [
    CommonModule,
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
    MdFormFieldModule,
];

@NgModule({
    imports: importExport,
    exports: importExport,
})
export class MDAppModule { }
