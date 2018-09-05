import { SetupModule } from './../../../features/setup/setup.module';
import { Component, OnInit, Output, OnDestroy, Input, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as moment from 'moment';
import { tap, map, filter } from 'rxjs/operators';
import { combineLatest, Subscription } from 'rxjs';

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

  @Output()
  public dateTimeChange = new EventEmitter<moment.Moment>();

  @Input()
  get dateTime() {
    return this.dateTimeValue;
  }

  set dateTime(dateTime: moment.Moment) {
    if (!this.dateTimeValue || !dateTime.isSame(this.dateTimeValue)) {
      this.dateTimeValue = dateTime;
      this.dateTimeChange.emit(this.dateTimeValue);
    }
  }

  private isDifferentDate(oldDate: moment.Moment, newDate: moment.Moment) {
    return !oldDate || !oldDate.isSame(newDate);
  }

  private setupInputSub() {
    this.sub = combineLatest(
      this.time.valueChanges,
      this.date.valueChanges,
    ).pipe(
      filter(([time, date]) => time && date),
      map(([time, date]: [string, moment.Moment]) => {
        const [hour, minute] = time.split(':');
        return [
          parseInt(hour, 10),
          parseInt(minute, 10),
          date
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
          this.dateTime = newDate;
        }
      })
    ).subscribe();
  }

  private setupChangeSub() {
    this.changeSub = this.dateTimeChange.pipe(
      filter(dateTime => !!dateTime),
      tap(dateTime => {
        this.date.setValue(dateTime);
        this.time.setValue(dateTime.format('HH:MM'));
      })
    ).subscribe();
  }

  constructor() {
    this.setupInputSub();
    this.setupChangeSub();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    this.changeSub.unsubscribe();
  }
}
