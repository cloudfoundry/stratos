import { ChangeDetectionStrategy, Component, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StratosStatus, StratosStatusMetadata } from '@stratosui/store';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { ApplicationStateIconComponent } from './application-state-icon/application-state-icon.component';

@Component({
  selector: 'app-application-state',
  templateUrl: './application-state.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ApplicationStateIconComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApplicationStateComponent implements OnInit {

  public readonly state = input.required<Observable<StratosStatusMetadata>>();

  // strict: assigned in ngOnInit when the required `state` @Input is present
  public status$!: Observable<StratosStatus>;

  // strict: assigned in ngOnInit; subLabel is optional + startWith(null)
  public subLabel$!: Observable<string | undefined | null>;

  // strict: assigned in ngOnInit; startWith(null) makes the first emission null
  public label$!: Observable<string | null>;

  public readonly hideIcon = input(false);

  public readonly initialStateOnly = input(false);

  constructor() { }

  ngOnInit() {
    const stateValue = this.state();
    if (stateValue) {
      this.status$ = stateValue.pipe(
        map(state => state.indicator)
      );
      this.subLabel$ = stateValue.pipe(
        map(state => state.subLabel),
        startWith(null)
      );
      this.label$ = stateValue.pipe(
        map(state => state.label),
        startWith(null)
      );
    }
  }
}
