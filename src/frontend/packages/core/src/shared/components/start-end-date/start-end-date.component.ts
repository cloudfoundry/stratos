import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output  } from '@angular/core';
import { isValid, isBefore, isEqual } from 'date-fns';

import { DateTimeComponent } from '../date-time/date-time.component';

@Component({
  selector: 'app-start-end-date',
  templateUrl: './start-end-date.component.html',
  styleUrls: ['./start-end-date.component.scss'],
  standalone: true,
  imports: [
    DateTimeComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
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
  set start(start: Date) {
    this.valid = true;
    if (start && isValid(start)) {
      const clone = new Date(start);
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
  set end(end: Date) {
    this.valid = true;
    if (end && isValid(end)) {
      const clone = new Date(end);
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
  public endChange = new EventEmitter<Date>();
  @Output()
  public startChange = new EventEmitter<Date>();

  @Output()
  public isValid = new EventEmitter<boolean>();

  public validValue = true;
  public validMessage: string;

  private startValue: Date;
  private endValue: Date;

  private lastValidStartValue: Date;
  private lastValidEndValue: Date;

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
  public validate: (start: Date, end: Date) => string = (start: Date, end: Date): string => {
    if (!end || !start) {
      return null;
    }
    return isBefore(end, start) ? 'Start date must be before end date.' : null;
  }

  private pValidate(start: Date, end: Date): boolean {
    this.validMessage = this.validate(start, end);
    return !this.validMessage;
  }

  private isDifferentDate(oldDate: Date, newDate: Date) {
    return !oldDate || !newDate || !isEqual(oldDate, newDate);
  }
}
