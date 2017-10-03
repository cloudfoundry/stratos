import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
    MdAutocompleteModule,
    MdButtonModule,
    MdCardModule,
    MdCheckboxModule,
    MdFormFieldModule,
    MdGridListModule,
    MdIconModule,
    MdInputModule,
    MdProgressBarModule,
    MdProgressSpinnerModule,
    MdSelectModule,
    MdSidenavModule,
    MdSliderModule,
    MdSlideToggleModule,
    MdTableModule,
    MdTabsModule,
    MdToolbarModule,
    MdTooltipModule,
} from '@angular/material';

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
    MdSliderModule,
    MdAutocompleteModule,
    MdTooltipModule
];

@NgModule({
    imports: importExport,
    exports: importExport,
})
export class MDAppModule { }
