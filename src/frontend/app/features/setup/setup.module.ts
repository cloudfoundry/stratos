import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { ConsoleUaaWizardComponent } from './uaa-wizard/console-uaa-wizard.component';
import { UpgradePageComponent } from './upgrade-page/upgrade-page.component';


@NgModule({
  imports: [
    CoreModule,
    SharedModule
  ],
  declarations: [
    ConsoleUaaWizardComponent,
    UpgradePageComponent
  ]
})
export class SetupModule { }
