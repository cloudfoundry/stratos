import { ChangeDetectionStrategy, Component, effect, input, output, untracked } from '@angular/core';
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

  // The dates a parent binds. They accept null/undefined so callers can bind
  // not-yet-chosen range values. The dates the two fields hold are startValue
  // and endValue.
  readonly start = input<Date | null | undefined>();
  readonly end = input<Date | null | undefined>();

  constructor() {
    // A bound date is taken up the same way as one picked in a field.
    effect(() => {
      const start = this.start();
      untracked(() => this.setStart(start));
    });
    effect(() => {
      const end = this.end();
      untracked(() => this.setEnd(end));
    });
  }

  setStart(start: Date | null | undefined) {
    this.valid = true;
    if (start && isValid(start)) {
      const clone = new Date(start);
      this.startValue = clone;
      if (!this.pValidate(start, this.endValue)) {
        this.valid = false;
      } else {
        this.emitChanges();
      }
    }
  }

  setEnd(end: Date | null | undefined) {
    this.valid = true;
    if (end && isValid(end)) {
      const clone = new Date(end);
      this.endValue = clone;
      if (!this.pValidate(this.startValue, end)) {
        this.valid = false;
      } else {
        this.emitChanges();
      }
    }
  }
  public readonly endChange = output<Date>();
  public readonly startChange = output<Date>();

  public readonly isValid = output<boolean>();

  public validValue = true;
  public validMessage: string | null = null;

  // Undefined until a valid date is set — validators see undefined for a missing date
  protected startValue?: Date;
  protected endValue?: Date;

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
  public readonly validate = input<((start: Date | undefined, end: Date | undefined) => string | null) | undefined>((start: Date | undefined, end: Date | undefined): string | null => {
    if (!end || !start) {
        return null;
    }
    return isBefore(end, start) ? 'Start date must be before end date.' : null;
});

  private pValidate(start: Date | undefined, end: Date | undefined): boolean {
    const validate = this.validate();
    this.validMessage = validate ? validate(start, end) : null;
    return !this.validMessage;
  }

  private isDifferentDate(oldDate: Date | undefined, newDate: Date | undefined) {
    return !oldDate || !newDate || !isEqual(oldDate, newDate);
  }
}
