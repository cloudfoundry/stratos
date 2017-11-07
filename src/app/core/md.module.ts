import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import 'hammerjs';
import {
  MdAutocompleteModule,
  MdButtonModule,
  MdCardModule,
  MdCheckboxModule,
  MdChipsModule,
  MdExpansionModule,
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
  MdPaginatorModule,
  MdSortModule,
  MdDialogModule,
  MdMenuModule
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
  MdTooltipModule,
  MdChipsModule,
  MdExpansionModule,
  MdPaginatorModule,
  MdSortModule,
  MdDialogModule,
  MdButtonToggleModule,
  MdMenuModule
];

@NgModule({
  imports: importExport,
  exports: importExport,
})
export class MDAppModule { }
