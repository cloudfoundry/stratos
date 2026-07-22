import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output  } from '@angular/core';
import { isValid, isBefore, isEqual } from 'date-fns';

import { DateTimeComponent } from '../date-time/date-time.component';

@Component({
  selector: 'app-start-end-date',
  templateUrl: './start-end-date.component.html',
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

  // Accepts null/undefined so callers can bind not-yet-chosen range values
  @Input()
  set start(start: Date | null | undefined) {
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

  get start(): Date | undefined {
    return this.startValue;
  }

  @Input()
  set end(end: Date | null | undefined) {
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

  get end(): Date | undefined {
    return this.endValue;
  }
  @Output()
  public endChange = new EventEmitter<Date>();
  @Output()
  public startChange = new EventEmitter<Date>();

  @Output()
  public isValid = new EventEmitter<boolean>();

  public validValue = true;
  public validMessage: string | null = null;

  // Undefined until a valid date is set — validators see undefined for a missing date
  private startValue?: Date;
  private endValue?: Date;

  private lastValidStartValue?: Date;
  private lastValidEndValue?: Date;

  private emitChanges() {
    if (this.startValue && this.isDifferentDate(this.lastValidStartValue, this.startValue)) {
      this.lastValidStartValue = this.startValue;
      this.startChange.emit(this.startValue);
    }
    if (this.endValue && this.isDifferentDate(this.lastValidEndValue, this.endValue)) {
      this.lastValidEndValue = this.endValue;
      this.endChange.emit(this.endValue);
    }
  }

  // Undefined (caller bound nothing) falls back to the default range check.
  // Validators receive whichever date is missing as null/undefined, so a custom
  // validator can also check a lone date.
  @Input()
  public validate: ((start: Date | undefined, end: Date | undefined) => string | null) | undefined =
    (start: Date | undefined, end: Date | undefined): string | null => {
      if (!end || !start) {
        return null;
      }
      return isBefore(end, start) ? 'Start date must be before end date.' : null;
    }

  private pValidate(start: Date | undefined, end: Date | undefined): boolean {
    this.validMessage = this.validate ? this.validate(start, end) : null;
    return !this.validMessage;
  }

  private isDifferentDate(oldDate: Date | undefined, newDate: Date | undefined) {
    return !oldDate || !newDate || !isEqual(oldDate, newDate);
  }
}
