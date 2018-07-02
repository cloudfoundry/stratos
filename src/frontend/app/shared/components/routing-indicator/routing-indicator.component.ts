import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel } from '@angular/router';
import { Observable, interval, of as observableOf } from 'rxjs'; import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-routing-indicator',
  templateUrl: './routing-indicator.component.html',
  styleUrls: ['./routing-indicator.component.scss']
})
export class RoutingIndicatorComponent implements OnInit {

  constructor(private router: Router) {
    this.value$ = this.router.events.pipe(
      switchMap(event => {
        if (event instanceof NavigationStart) {
          return this.getValueEmitter();
        }
        return observableOf(0);
      })
    );
  }
  public value$: Observable<number>;
  ngOnInit() {

  }

  private getValueEmitter() {
    const getValue = this.getValue();
    return interval(2000).pipe(
      map(() => getValue())
    );
  }

  private getValue(startWith: number = 10, i: number = 4) {
    startWith = Math.max(startWith - i, 0);
    return () => {
      startWith = Math.min(startWith + i, 100);
      return startWith;
    };
  }

}
