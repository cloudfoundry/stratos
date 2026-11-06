import { ChangeDetectionStrategy, Component, OnDestroy, effect, model, untracked } from '@angular/core';

import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { debounceTime, filter, map, shareReplay, tap } from 'rxjs/operators';
import { format, parse, setHours, setMinutes, isValid, isEqual } from 'date-fns';

@Component({
  selector: 'app-date-time',
  standalone: true,
  imports: [
    ReactiveFormsModule
],
  templateUrl: './date-time.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateTimeComponent implements OnDestroy {

  public date = new FormControl<string | null>(null);
  public time = new FormControl<string | null>(null);
  private sub!: Subscription;
  // The date the two fields show. Null until a date is chosen (or when the
  // bound value is cleared)
  private dateTimeValue: Date | null = null;

  private dateObservable: Observable<string>;
  private timeObservable: Observable<string>;

  // A model: a parent binds it, and a date and time typed into the fields set
  // it, which emits dateTimeChange.
  readonly dateTime = model<Date | null | undefined>();

  // Puts a bound date into the fields. A date typed into them is already
  // there (it equals dateTimeValue), and an invalid date is ignored.
  private showDateTime(dateTime: Date | null | undefined) {
    const empty = !dateTime && this.dateTimeValue !== dateTime;
    const validDate = dateTime && isValid(dateTime) && (!this.dateTimeValue || !isEqual(dateTime, this.dateTimeValue));
    if (!empty && !validDate) {
      return;
    }
    this.dateTimeValue = dateTime ?? null;
    if (!this.dateTimeValue) {
      this.emptyDateTime();
    } else {
      this.stopInputSub();
      this.date.setValue(format(this.dateTimeValue, 'yyyy-MM-dd'));
      this.time.setValue(format(this.dateTimeValue, 'HH:mm'));
      this.setupInputSub();
    }
  }

  private isDifferentDate(oldDate: Date | null, newDate: Date) {
    return !oldDate || !newDate || !isValid(newDate) || !isEqual(oldDate, newDate);
  }

  private setupInputSub() {
    this.stopInputSub();
    this.sub = combineLatest([
      this.timeObservable,
      this.dateObservable
    ]).pipe(
      debounceTime(250),
      filter(([time, date]) => !!(time && date)),
      map(([time, date]: [string, string]): [number, number, Date] => {
        const [hour, minute] = time.split(':');
        return [
          parseInt(hour, 10),
          parseInt(minute, 10),
          parse(date, 'yyyy-MM-dd', new Date())
        ];
      }),
      filter(([hour, minute]: [number, number, Date]) => {
        return !isNaN(hour + minute);
      }),
      tap(([hour, minute, date]: [number, number, Date]) => {

        const newDate = setMinutes(setHours(new Date(date), hour), minute);
        // An invalid date (a half-typed field) is not passed on
        if (isValid(newDate) && this.isDifferentDate(this.dateTimeValue, newDate)) {
          this.dateTimeValue = newDate;
          this.dateTime.set(newDate);
        }
      })
    ).subscribe();
  }

  private replayObservable(obs: Observable<any>) {
    return obs.pipe(
      shareReplay(1)
    );
  }

  private stopInputSub() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  constructor() {
    this.dateObservable = this.replayObservable(
      this.date.valueChanges
    );
    this.timeObservable = this.replayObservable(
      this.time.valueChanges
    );
    this.setupInputSub();
    this.emptyDateTime();
    effect(() => {
      const dateTime = this.dateTime();
      untracked(() => this.showDateTime(dateTime));
    });
  }

  private emptyDateTime() {
    this.date.setValue(null);
    this.time.setValue('00:00');
  }

  ngOnDestroy() {
    this.stopInputSub();
  }
}
