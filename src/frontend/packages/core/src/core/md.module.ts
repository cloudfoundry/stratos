import 'hammerjs';

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
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
  MatDatepickerModule,
  DateAdapter,
  MAT_DATE_LOCALE,
  MAT_DATE_FORMATS,
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
  MatRadioModule,
  MatDatepickerModule
];

@NgModule({
  imports: importExport,
  exports: importExport,
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS }
  ],
})
export class MDAppModule { }
