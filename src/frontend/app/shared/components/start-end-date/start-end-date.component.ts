import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
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

  private startValue: moment.Moment;
  private endValue: moment.Moment;

  private isDifferentDate(oldDate: moment.Moment, newDate: moment.Moment) {
    return !oldDate || !newDate || !oldDate.isSame(newDate);
  }

  @Input()
  set start(start: moment.Moment) {
    if (start && start.isValid()) {
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
    if (end && end.isValid()) {
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
