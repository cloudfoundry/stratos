import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { ConsoleUaaWizardComponent } from './uaa-wizard/console-uaa-wizard.component';


@NgModule({
    imports: [
	CoreModule,
	SharedModule
    ],
    declarations: [
	ConsoleUaaWizardComponent
    ]
})
export class UAASetupModule { }
