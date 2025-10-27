import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { Store } from '@ngrx/store';
import { Logout, AppState } from '@stratosui/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IntroScreenComponent } from '../../../shared/components/intro-screen/intro-screen.component';
import { StratosTitleComponent } from '../../../shared/components/stratos-title/stratos-title.component';

@Component({
selector: 'app-logout-page',
  templateUrl: './logout-page.component.html',
  styleUrls: ['./logout-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatButtonModule,
    IntroScreenComponent,
    StratosTitleComponent
  ]
})
export class LogoutPageComponent implements OnInit {

  public error$: Observable<boolean>;

  constructor(private store: Store<AppState>) {
    this.error$ = this.store.select(s => s.auth).pipe(
      map(auth => auth.error)
    );
  }

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
