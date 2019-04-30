import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CloudFoundrySpaceService } from '../../../../features/cloud-foundry/services/cloud-foundry-space.service';

@Component({
  selector: 'app-card-cf-space-details',
  templateUrl: './card-cf-space-details.component.html',
  styleUrls: ['./card-cf-space-details.component.scss']
})
export class CardCfSpaceDetailsComponent {
  allowSshStatus$: Observable<string>;

  constructor(public cfSpaceService: CloudFoundrySpaceService) {
    this.allowSshStatus$ = cfSpaceService.allowSsh$.pipe(
      map(status => status === 'false' ? 'Disabled' : 'Enabled')
    );
  }
}
