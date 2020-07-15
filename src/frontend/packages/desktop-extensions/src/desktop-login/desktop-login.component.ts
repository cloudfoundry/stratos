import { Component, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';

import { LoginPageComponent, StratosLoginComponent } from '../../../core/src/public-api';
import { AppState } from '../../../store/src/app-state';

@StratosLoginComponent()
@Component({
  selector: 'app-desktop-login',
  templateUrl: './desktop-login.component.html',
  styleUrls: ['./desktop-login.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DesktopLoginComponent extends LoginPageComponent {
  constructor(
    store: Store<AppState>,
  ) {
    super(store);
  }
}
