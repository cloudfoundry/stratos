import { Component, EventEmitter, Input, Output } from '@angular/core';

import moment from 'moment';

@Component({
  selector: 'app-start-end-date',
  templateUrl: './start-end-date.component.html',
  styleUrls: ['./start-end-date.component.scss']
})
export class StartEndDateComponent {

  get valid() {
    return this.validValue;
  }

  set valid(valid: boolean) {
    this.validValue = valid;
    this.isValid.emit(this.validValue);
  }

  @Input()
  set start(start: moment.Moment) {
    this.valid = true;
    if (start && start.isValid()) {
      const clone = moment(start);
      this.startValue = clone;
      if (!this.pValidate(start, this.end)) {
        this.valid = false;
      } else {
        this.emitChanges();
      }
    }
  }

  get start() {
    return this.startValue;
  }

  @Input()
  set end(end: moment.Moment) {
    this.valid = true;
    if (end && end.isValid()) {
      const clone = moment(end);
      this.endValue = clone;
      if (!this.pValidate(this.start, end)) {
        this.valid = false;
      } else {
        this.emitChanges();
      }
    }
  }

  get end() {
    return this.endValue;
  }
  @Output()
  public endChange = new EventEmitter<moment.Moment>();
  @Output()
  public startChange = new EventEmitter<moment.Moment>();

  @Output()
  public isValid = new EventEmitter<boolean>();

  public validValue = true;
  public validMessage: string;

  private startValue: moment.Moment;
  private endValue: moment.Moment;

  private lastValidStartValue: moment.Moment;
  private lastValidEndValue: moment.Moment;

  private emitChanges() {
    if (this.isDifferentDate(this.lastValidStartValue, this.startValue)) {
      this.lastValidStartValue = this.startValue;
      this.startChange.emit(this.startValue);
    }
    if (this.isDifferentDate(this.lastValidEndValue, this.endValue)) {
      this.lastValidEndValue = this.endValue;
      this.endChange.emit(this.endValue);
    }
  }

  @Input()
  public validate: (start: moment.Moment, end: moment.Moment) => string = (start: moment.Moment, end: moment.Moment): string => {
    if (!end || !start) {
      return null;
    }
    return end.isBefore(start) ? 'Start date must be before end date.' : null;
  }

  private pValidate(start: moment.Moment, end: moment.Moment): boolean {
    this.validMessage = this.validate(start, end);
    return !this.validMessage;
  }

  private isDifferentDate(oldDate: moment.Moment, newDate: moment.Moment) {
    return !oldDate || !newDate || !oldDate.isSame(newDate);
  }
}
