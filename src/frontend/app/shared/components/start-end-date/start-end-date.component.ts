import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-start-end-date',
  templateUrl: './start-end-date.component.html',
  styleUrls: ['./start-end-date.component.scss']
})
export class StartEndDateComponent implements OnInit {
  @Output()
  public endChange = new EventEmitter<moment.Moment>();
  @Output()
  public startChange = new EventEmitter<moment.Moment>();

  private startValue: moment.Moment;
  private endValue: moment.Moment;

  @Input()
  set start(start: moment.Moment) {
    this.startValue = start;
    this.startChange.emit(start);
  }

  get start() {
    return this.startValue;
  }

  @Input()
  set end(end: moment.Moment) {
    this.endValue = end;
    this.endChange.emit(end);
  }

  get end() {
    return this.endValue;
  }

  constructor() { }

  ngOnInit() {
  }
}
