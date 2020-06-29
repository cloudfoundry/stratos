import { Component, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';

import { CustomizationService, CustomizationsMetadata } from '../../../../core/src/core/customizations.types';
import { StratosLoginComponent } from '../../../../core/src/core/extension/extension-service';
import { LoginPageComponent } from '../../../../core/src/features/login/login-page/login-page.component';
import { AppState } from '../../../../store/src/app-state';

@StratosLoginComponent()
@Component({
  selector: 'app-suse-login',
  templateUrl: './suse-login.component.html',
  styleUrls: ['./suse-login.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SuseLoginComponent extends LoginPageComponent {

  public config: CustomizationsMetadata;

  constructor(
    store: Store<AppState>,
    cs: CustomizationService
  ) {
    super(store);
    this.config = cs.get();
  }
}
