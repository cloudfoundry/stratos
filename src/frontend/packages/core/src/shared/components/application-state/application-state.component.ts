import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { StratosStatus, StratosStatusMetadata } from '../../../../../store/src/types/shared.types';

@Component({
  selector: 'app-application-state',
  templateUrl: './application-state.component.html',
  styleUrls: ['./application-state.component.scss']
})
export class ApplicationStateComponent implements OnInit {

  @Input()
  public state: Observable<StratosStatusMetadata>;

  public status$: Observable<StratosStatus>;

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
