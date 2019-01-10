import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { Customizations, CustomizationsMetadata } from '../../core/customizations.types';
import { StratosLoginComponent } from '../../core/extension/extension-service';
import { LoginPageComponent } from '../../features/login/login-page/login-page.component';
import { AppState } from '../../store/app-state';

@StratosLoginComponent()
@Component({
  selector: 'app-suse-login',
  templateUrl: './suse-login.component.html',
  styleUrls: ['./suse-login.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SuseLoginComponent extends LoginPageComponent {

  constructor(
    store: Store<AppState>,
    @Inject(Customizations) public config: CustomizationsMetadata
  ) {
    super(store);
  }
}
