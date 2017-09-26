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
    MdProgressBarModule,
    MdSlideToggleModule,
    MdSliderModule
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
    MdProgressBarModule,
    MdSlideToggleModule,
    MdSliderModule
];

@NgModule({
    imports: importExport,
    exports: importExport,
})
export class MDAppModule { }
