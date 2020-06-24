import { Component, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { CustomizationService, CustomizationsMetadata, LoginPageComponent, StratosLoginComponent } from '@stratosui/core';
import { AppState } from '@stratosui/store';

@StratosLoginComponent()
@Component({
  selector: 'app-acme-login',
  templateUrl: './acme-login.component.html',
  styleUrls: ['./acme-login.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AcmeLoginComponent extends LoginPageComponent {

  config: CustomizationsMetadata;

  constructor(
    store: Store<AppState>,
    cs: CustomizationService,
  ) {
    super(store);
    this.config = cs.get();
  }
}
