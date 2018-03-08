import { Component, OnInit } from '@angular/core';
import { ListConfig } from '../../../../../../../shared/components/list/list.component.types';
/* tslint:disable:max-line-length */
import { CfSpaceRoutesListConfigService } from '../../../../../../../shared/components/list/list-types/cf-space-routes/cf-space-routes-list-config.service';
/* tslint:enable:max-line-length */

@Component({
  selector: 'app-cloud-foundry-space-routes',
  templateUrl: './cloud-foundry-space-routes.component.html',
  styleUrls: ['./cloud-foundry-space-routes.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfSpaceRoutesListConfigService
    }
  ]
})
export class CloudFoundrySpaceRoutesComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
