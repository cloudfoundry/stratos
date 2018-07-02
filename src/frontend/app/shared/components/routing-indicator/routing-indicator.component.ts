import { Component } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { interval, Observable, of as observableOf } from 'rxjs';
import { filter, map, startWith, switchMap, delay } from 'rxjs/operators';

@Component({
  selector: 'app-routing-indicator',
  templateUrl: './routing-indicator.component.html',
  styleUrls: ['./routing-indicator.component.scss']
})
export class RoutingIndicatorComponent {
  public value$: Observable<number>;

  constructor(private router: Router) {
    this.value$ = this.router.events.pipe(
      filter(event => {
        return event instanceof NavigationStart ||
          event instanceof NavigationCancel ||
          event instanceof NavigationEnd;
      }),
      switchMap(event => {
        if (event instanceof NavigationStart) {
          return this.getValueEmitter();
        }
        return observableOf(0);
      })
    );
  }

  private getValueEmitter() {
    const getValue = this.getValue();
    return interval(500).pipe(
      delay(500),
      map(() => getValue())
    );
  }

  private getValue(minStep: number = 1, maxStep: number = 3) {
    let value = 1;
    const maxValue = 90;
    return () => {
      if (value >= maxValue) {
        return value;
      }
      const increase = Math.floor(Math.random() * maxStep) + minStep;
      value = Math.min(value + increase, maxValue);
      return value;
    };
  }

}
