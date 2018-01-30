import 'hammerjs';

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatButtonToggleModule,
  MatCardModule,
  MatCheckboxModule,
  MatChipsModule,
  MatDialogModule,
  MatExpansionModule,
  MatFormFieldModule,
  MatGridListModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatPaginatorModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatSelectModule,
  MatSidenavModule,
  MatSliderModule,
  MatSlideToggleModule,
  MatSnackBarModule,
  MatSortModule,
  MatTableModule,
  MatTabsModule,
  MatToolbarModule,
  MatTooltipModule,
  MatRadioModule,
} from '@angular/material';

const importExport = [
  CommonModule,
  MatButtonModule,
  MatCheckboxModule,
  MatInputModule,
  MatCardModule,
  MatProgressSpinnerModule,
  MatSidenavModule,
  MatTabsModule,
  MatIconModule,
  MatSelectModule,
  MatGridListModule,
  MatTableModule,
  MatToolbarModule,
  MatFormFieldModule,
  MatProgressBarModule,
  MatSlideToggleModule,
  MatSliderModule,
  MatAutocompleteModule,
  MatTooltipModule,
  MatChipsModule,
  MatExpansionModule,
  MatPaginatorModule,
  MatSortModule,
  MatDialogModule,
  MatButtonToggleModule,
  MatMenuModule,
  MatSnackBarModule,
  MatListModule,
  MatRadioModule
];

@NgModule({
  imports: importExport,
  exports: importExport,
})
export class MDAppModule { }
