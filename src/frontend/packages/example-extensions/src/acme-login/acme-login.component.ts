import { Component, ViewEncapsulation } from '@angular/core';
import { CustomizationService, CustomizationsMetadata, LoginPageComponent, StratosLoginComponent } from '@stratosui/core';

@StratosLoginComponent()
@Component({
selector: 'app-acme-login',
  templateUrl: './acme-login.component.html',
  styleUrls: ['./acme-login.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false
})
export class AcmeLoginComponent extends LoginPageComponent {

  config: CustomizationsMetadata;

  constructor(
    cs: CustomizationService,
  ) {
    super();
    this.config = cs.get();
  }
}
