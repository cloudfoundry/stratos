import { Component, OnInit, Output, OnDestroy, Input, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { combineLatest, Subscription, Observable } from 'rxjs';
import { tap, map, filter, shareReplay, debounceTime } from 'rxjs/operators';

import { SetupModule } from './../../../features/setup/setup.module';

import moment from 'moment';

@Component({
  selector: 'app-date-time',
  templateUrl: './date-time.component.html',
  styleUrls: ['./date-time.component.scss']
})
export class DateTimeComponent implements OnDestroy {

  public date = new FormControl();
  public time = new FormControl();
  private sub: Subscription;
  private changeSub: Subscription;
  private dateTimeValue: moment.Moment;

  private dateObservable: Observable<Date>;
  private timeObservable: Observable<string>;

  @Output()
  public dateTimeChange = new EventEmitter<moment.Moment>();

  @Input()
  get dateTime() {
    return this.dateTimeValue;
  }

  set dateTime(dateTime: moment.Moment) {
    const empty = !dateTime && this.dateTimeValue !== dateTime;
    const validDate = dateTime && dateTime.isValid() && (!this.dateTimeValue || !dateTime.isSame(this.dateTimeValue));
    if (empty || validDate) {
      this.dateTimeValue = dateTime;
      this.dateTimeChange.emit(this.dateTimeValue);
    }
  }

  private isDifferentDate(oldDate: moment.Moment, newDate: moment.Moment) {
    return !oldDate || !newDate || !newDate.isValid() || !oldDate.isSame(newDate);
  }

  private setupInputSub() {
    this.stopInputSub();
    this.sub = combineLatest(
      this.timeObservable,
      this.dateObservable
    ).pipe(
      debounceTime(250),
      filter(([time, date]) => !!(time && date)),
      map(([time, date]: [string, Date]) => {
        const [hour, minute] = time.split(':');
        return [
          parseInt(hour, 10),
          parseInt(minute, 10),
          moment(date)
        ];
      }),
      filter(([hour, minute]: [number, number, moment.Moment]) => {
        return !isNaN(hour + minute);
      }),
      tap(([hour, minute, date]: [number, number, moment.Moment]) => {

        const newDate = date.clone().set({
          hour,
          minute
        });
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
          this.date.setValue(dateTime);
          this.time.setValue(dateTime.format('HH:mm'));
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
