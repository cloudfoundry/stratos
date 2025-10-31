import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output  } from '@angular/core';

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
  styleUrls: ['./date-time.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateTimeComponent implements OnDestroy {

  public date = new FormControl<string | null>(null);
  public time = new FormControl<string | null>(null);
  private sub: Subscription;
  private changeSub: Subscription;
  private dateTimeValue: Date;

  private dateObservable: Observable<string>;
  private timeObservable: Observable<string>;

  @Output()
  public dateTimeChange = new EventEmitter<Date>();

  @Input()
  get dateTime() {
    return this.dateTimeValue;
  }

  set dateTime(dateTime: Date) {
    const empty = !dateTime && this.dateTimeValue !== dateTime;
    const validDate = dateTime && isValid(dateTime) && (!this.dateTimeValue || !isEqual(dateTime, this.dateTimeValue));
    if (empty || validDate) {
      this.dateTimeValue = dateTime;
      this.dateTimeChange.emit(this.dateTimeValue);
    }
  }

  private isDifferentDate(oldDate: Date, newDate: Date) {
    return !oldDate || !newDate || !isValid(newDate) || !isEqual(oldDate, newDate);
  }

  private setupInputSub() {
    this.stopInputSub();
    this.sub = combineLatest(
      this.timeObservable,
      this.dateObservable
    ).pipe(
      debounceTime(250),
      filter(([time, date]) => !!(time && date)),
      map(([time, date]: [string, string]) => {
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
        if (this.isDifferentDate(this.dateTime, newDate)) {
          this.stopChangeSub();
          this.dateTime = newDate;
          this.setupChangeSub();
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

  private setupChangeSub() {
    this.stopChangeSub();
    this.changeSub = this.dateTimeChange.pipe(
      tap(dateTime => {
        if (!dateTime) {
          this.emptyDateTime();
        } else {
          this.stopInputSub();
          this.date.setValue(format(dateTime, 'yyyy-MM-dd'));
          this.time.setValue(format(dateTime, 'HH:mm'));
          this.setupInputSub();
        }
      })
    ).subscribe();
  }

  private stopChangeSub() {
    if (this.changeSub) {
      this.changeSub.unsubscribe();
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
    this.setupChangeSub();
    this.emptyDateTime();
  }

  private emptyDateTime() {
    this.date.setValue(null);
    this.time.setValue('00:00');
  }

  ngOnDestroy() {
    this.stopInputSub();
    this.changeSub.unsubscribe();
  }
}
