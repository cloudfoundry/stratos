import { Component, ViewEncapsulation } from '@angular/core';

import { LoginPageComponent, StratosLoginComponent } from '../../../core/src/public-api';

@StratosLoginComponent()
@Component({
  selector: 'app-desktop-login',
  templateUrl: './desktop-login.component.html',
  styleUrls: ['./desktop-login.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: []
})
export class DesktopLoginComponent extends LoginPageComponent {
}
