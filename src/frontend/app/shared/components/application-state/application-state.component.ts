import { Component, Input, OnInit } from '@angular/core';
import { CardStatus, ApplicationStateData } from './application-state.service';
import { Observable } from 'rxjs';
import { map, tap, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-application-state',
  templateUrl: './application-state.component.html',
  styleUrls: ['./application-state.component.scss']
})
export class ApplicationStateComponent implements OnInit {

  @Input()
  public state: Observable<ApplicationStateData>;

  public status$: Observable<CardStatus>;

  public subLabel$: Observable<string>;

  public label$: Observable<string>;

  @Input()
  public hideIcon = false;

  @Input()
  public initialStateOnly = false;

  constructor() { }

  ngOnInit() {
    if (this.state) {
      this.status$ = this.state.pipe(
        map(state => state.indicator)
      );
      this.subLabel$ = this.state.pipe(
        map(state => state.subLabel),
        startWith(null)
      );
      this.label$ = this.state.pipe(
        map(state => state.label),
        startWith(null)
      );
    }
  }
}
