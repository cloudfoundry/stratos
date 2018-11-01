import { Component, EventEmitter, Input, Output } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-start-end-date',
  templateUrl: './start-end-date.component.html',
  styleUrls: ['./start-end-date.component.scss']
})
export class StartEndDateComponent {
  @Output()
  public endChange = new EventEmitter<moment.Moment>();
  @Output()
  public startChange = new EventEmitter<moment.Moment>();

  @Output()
  public isValid = new EventEmitter<boolean>();

  get valid() {
    return this.validValue;
  }

  set valid(valid: boolean) {
    this.validValue = valid;
    this.isValid.emit(this.validValue);
  }

  public validValue = true;

  private startValue: moment.Moment;
  private endValue: moment.Moment;


  private isDifferentDate(oldDate: moment.Moment, newDate: moment.Moment) {
    return !oldDate || !newDate || !oldDate.isSame(newDate);
  }

  private isStartEndValid(start: moment.Moment, end: moment.Moment) {
    if (!end || !start) {
      return true;
    }
    return start.isBefore(end);
  }

  @Input()
  set start(start: moment.Moment) {
    this.valid = true;
    if (!start) {
      this.startValue = start;
      return;
    }
    if (start.isValid()) {
      if (!this.isStartEndValid(start, this.end)) {
        this.valid = false;
        return;
      }
      if (this.isDifferentDate(this.startValue, start)) {
        const clone = moment(start);
        this.startValue = clone;
        this.startChange.emit(clone);
      }
    }
  }

  get start() {
    return this.startValue;
  }

  @Input()
  set end(end: moment.Moment) {
    this.valid = true;
    if (!end) {
      this.endValue = end;
      return;
    }
    if (end && end.isValid()) {
      if (!this.isStartEndValid(this.start, end)) {
        this.valid = false;
        return;
      }
      if (this.isDifferentDate(this.endValue, end)) {
        const clone = moment(end);
        this.endValue = clone;
        this.endChange.emit(clone);
      }
    }
  }

  get end() {
    return this.endValue;
  }
}
