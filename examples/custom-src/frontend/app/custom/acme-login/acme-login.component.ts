import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Customizations, CustomizationsMetadata } from '../../core/customizations.types';
import { LoginPageComponent } from '../../features/login/login-page/login-page.component';
import { AppState } from '../../store/app-state';
import { StratosLoginComponent } from '../../core/extension/extension-service';

@StratosLoginComponent()
@Component({
  selector: 'app-acme-login',
  templateUrl: './acme-login.component.html',
  styleUrls: ['./acme-login.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AcmeLoginComponent extends LoginPageComponent {

  constructor(
    store: Store<AppState>,
    router: Router,
    @Inject(Customizations) public config: CustomizationsMetadata
  ) {
    super(store, router);
   }
}
