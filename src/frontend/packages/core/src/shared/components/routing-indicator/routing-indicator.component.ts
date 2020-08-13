import { Component } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { interval, Observable, of as observableOf } from 'rxjs';
import { filter, map, startWith, switchMap, delay, tap } from 'rxjs/operators';

@Component({
  selector: 'app-routing-indicator',
  templateUrl: './routing-indicator.component.html',
  styleUrls: ['./routing-indicator.component.scss']
})
export class RoutingIndicatorComponent {
  public value$: Observable<number>;

  public HIDE_VALUE = 101;
  private started = false;
  constructor(private router: Router) {
    this.value$ = this.router.events.pipe(
      filter(event => {
        return (event instanceof NavigationStart && !this.started) ||
          event instanceof NavigationCancel ||
          event instanceof NavigationEnd;
      }),
      switchMap(event => {
        if (event instanceof NavigationStart) {
          return this.getValueEmitter();
        }
        const endObs$ = observableOf(this.HIDE_VALUE);
        if (this.started) {
          this.started = false;
          return endObs$.pipe(
            delay(200),
            startWith(100)
          );
        } else {
          return endObs$;
        }
      })
    );
  }

  private getValueEmitter() {
    const getValue = this.getValue();
    return interval(80).pipe(
      delay(500),
      map(() => getValue()),
      tap(() => this.started = true)
    );
  }
  // Fakes a natual loading indicator
  private getValue(minStep: number = 0.1, maxStep: number = 2) {
    let value = 0.1;
    const slowDownValue = 60;
    const top = 95;
    return () => {
      if (value >= top) {
        return top;
      }
      if (value >= slowDownValue) {
        return value += this.getRandomNumber(0.1, 0.6);
      }
      const increase = this.getRandomNumber(minStep, maxStep);
      value = Math.min(value + increase, top);
      return value;
    };
  }

  private getRandomNumber(min: number, max: number) {
    return (Math.random() * max) + min;
  }

}
