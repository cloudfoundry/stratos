import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { CardWrapperComponent } from '../../../shared/components/cards/card/card.component';
import { AppState, Logout, Store } from '@stratosui/store';
import { Observable } from 'rxjs';

import { AuthSignalService } from '../../../core/signals/auth-signal.service';
import { IntroScreenComponent } from '../../../shared/components/intro-screen/intro-screen.component';
import { StratosTitleComponent } from '../../../shared/components/stratos-title/stratos-title.component';
import { AppProgressBarComponent } from '../../../shared/components/progress-bar/app-progress-bar.component';

@Component({
selector: 'app-logout-page',
  templateUrl: './logout-page.component.html',
  styleUrls: ['./logout-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    CardWrapperComponent,
    IntroScreenComponent,
    StratosTitleComponent,
    AppProgressBarComponent
  ]
})
export class LogoutPageComponent implements OnInit {

  private store = inject(Store<AppState>);
  private auth = inject(AuthSignalService);

  public error$: Observable<boolean> = toObservable(this.auth.error);

  ngOnInit() {
    // Dispatch the logout action after 1 second - give the logging out screen time to show
    setTimeout(() => {
      this.store.dispatch(new Logout());
    }, 1000);
  }

  reload() {
    window.location.assign(window.location.origin);
  }

}
