import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { ConsoleUaaWizardComponent } from './uaa-wizard/console-uaa-wizard.component';
import { UpgradePageComponent } from './upgrade-page/upgrade-page.component';
import { DomainMismatchComponent } from './domain-mismatch/domain-mismatch.component';
import { StratosComponentsModule } from '@stratos/shared';


@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    StratosComponentsModule
  ],
  declarations: [
    ConsoleUaaWizardComponent,
    UpgradePageComponent,
    DomainMismatchComponent
  ]
})
export class SetupModule { }
