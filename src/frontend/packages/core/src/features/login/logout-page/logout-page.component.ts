import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { CardWrapperComponent } from '../../../shared/components/cards/card/card.component';
import { Observable } from 'rxjs';

import { AuthSignalService } from '../../../core/signals/auth-signal.service';
import { IntroScreenComponent } from '../../../shared/components/intro-screen/intro-screen.component';
import { StratosTitleComponent } from '../../../shared/components/stratos-title/stratos-title.component';
import { AppProgressBarComponent } from '../../../shared/components/progress-bar/app-progress-bar.component';

@Component({
selector: 'app-logout-page',
  templateUrl: './logout-page.component.html',
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

  private auth = inject(AuthSignalService);

  public error$: Observable<boolean> = toObservable(this.auth.error);

  ngOnInit() {
    // Trigger logout after 1 second - give the logging out screen time to show
    setTimeout(() => {
      this.auth.logout();
    }, 1000);
  }

  reload() {
    window.location.assign(window.location.origin);
  }

}
