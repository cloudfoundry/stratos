import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApplicationStateComponent } from '../../../../../../core/src/shared/components/application-state/application-state.component';
import { CardStatusComponent } from '../../../../../../core/src/shared/components/cards/card-status/card-status.component';
import { ApplicationService } from '../../../../../../cloud-foundry/src/features/applications/application.service';
import { StratosStatus } from '../../../../../../store/src/types/shared.types';

@Component({
  selector: 'app-card-app-status',
  templateUrl: './card-app-status.component.html',
  styleUrls: ['./card-app-status.component.scss'],
  standalone: true,
  imports: [
    CardStatusComponent,
    ApplicationStateComponent
  ]
})
export class CardAppStatusComponent implements OnInit {
  status$: Observable<StratosStatus>;
  constructor(public applicationService: ApplicationService) { }

  ngOnInit() {
    this.status$ = this.applicationService.applicationState$.pipe(
      map(state => state.indicator)
    );
  }

}
