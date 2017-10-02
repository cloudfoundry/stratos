import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { CoreModule } from '../core/core.module';
import { DisplayValueComponent } from './components/display-value/display-value.component';
import { EditableDisplayValueComponent } from './components/editable-display-value/editable-display-value.component';
import { LoadingPageComponent } from './components/loading-page/loading-page.component';
import { PageHeaderModule } from './components/page-header/page-header.module';
import { SteppersModule } from './components/stepper/steppers.module';
import { MbToHumanSizePipe } from './pipes/mb-to-human-size.pipe';


@NgModule({
    imports: [
        CommonModule,
        CoreModule,
        PageHeaderModule,
        RouterModule,
        SteppersModule
    ],
    declarations: [
        LoadingPageComponent,
        DisplayValueComponent,
        EditableDisplayValueComponent,
        MbToHumanSizePipe,
        LoadingPageComponent,
    ],
    exports: [
        FormsModule,
        ReactiveFormsModule,
        LoadingPageComponent,
        PageHeaderModule,
        DisplayValueComponent,
        EditableDisplayValueComponent,
        MbToHumanSizePipe,
        SteppersModule
    ]
})
export class SharedModule { }
