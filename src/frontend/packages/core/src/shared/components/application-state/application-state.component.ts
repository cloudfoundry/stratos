import { ChangeDetectionStrategy, Component, Input, type OnInit  } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import type { StratosStatus, StratosStatusMetadata } from '@stratosui/store';
import type { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { ApplicationStateIconComponent } from './application-state-icon/application-state-icon.component';

@Component({
  selector: 'app-application-state',
  templateUrl: './application-state.component.html',
  styleUrls: ['./application-state.component.scss'],
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

  public status$: Observable<StratosStatus>;

  public subLabel$: Observable<string>;

  public label$: Observable<string>;

  @Input()
  public hideIcon = false;

  @Input()
  public initialStateOnly = false;

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
