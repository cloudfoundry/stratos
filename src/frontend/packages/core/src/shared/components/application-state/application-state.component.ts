import { ChangeDetectionStrategy, Component, Input, OnInit  } from '@angular/core';
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

  @Input()
  public state!: Observable<StratosStatusMetadata>;

  // strict: assigned in ngOnInit when the required `state` @Input is present
  public status$!: Observable<StratosStatus>;

  // strict: assigned in ngOnInit; subLabel is optional + startWith(null)
  public subLabel$!: Observable<string | undefined | null>;

  // strict: assigned in ngOnInit; startWith(null) makes the first emission null
  public label$!: Observable<string | null>;

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
