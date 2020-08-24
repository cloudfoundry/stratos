import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Logout, AppState } from '@stratosui/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-logout-page',
  templateUrl: './logout-page.component.html',
  styleUrls: ['./logout-page.component.scss']
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
    }, 1000)
  }

  reload() {
    window.location.assign(window.location.origin);
  }

}
