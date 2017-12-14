import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import 'hammerjs';
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatChipsModule,
  MatExpansionModule,
  MatFormFieldModule,
  MatGridListModule,
  MatIconModule,
  MatInputModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatSelectModule,
  MatSidenavModule,
  MatSliderModule,
  MatSlideToggleModule,
  MatTableModule,
  MatTabsModule,
  MatToolbarModule,
  MatTooltipModule,
  MatPaginatorModule,
  MatSortModule,
  MatDialogModule,
  MatMenuModule,
  MatButtonToggleModule,
  MatSnackBarModule
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
  MatSnackBarModule
];

@NgModule({
  imports: importExport,
  exports: importExport,
})
export class MDAppModule { }
