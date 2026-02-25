import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApplicationStateComponent, CardStatusComponent } from '@stratosui/core';
import { StratosStatus } from '@stratosui/store';
import { ApplicationService } from '../../../../features/applications/application.service';

@Component({
  selector: 'app-card-app-status',
  templateUrl: './card-app-status.component.html',
  styleUrls: ['./card-app-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CardStatusComponent,
    ApplicationStateComponent
  ]
})
export class CardAppStatusComponent implements OnInit {
  public applicationService = inject(ApplicationService);

  status$!: Observable<StratosStatus>;

  ngOnInit() {
    this.status$ = this.applicationService.applicationState$.pipe(
      map(state => state.indicator)
    );
  }

}
