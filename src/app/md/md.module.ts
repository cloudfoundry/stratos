import { NgModule } from '@angular/core';
import { MdButtonModule, MdCheckboxModule, MdInputModule, MdCardModule, MdProgressSpinnerModule } from '@angular/material';

const importExport = [
    MdButtonModule,
    MdCheckboxModule,
    MdInputModule,
    MdCardModule,
    MdProgressSpinnerModule
];

@NgModule({
    imports: importExport,
    exports: importExport,
})
export class MDAppModule {}
