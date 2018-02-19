import { Component, OnInit } from '@angular/core';
import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { CfAppConfigService } from '../../../../shared/components/list/list-types/app/cf-app-config.service';
import { ListDataSource } from '../../../../shared/components/list/data-sources-controllers/list-data-source';
import { APIResource } from '../../../../store/types/api.types';
import { CfOrgsListConfigService } from '../../../../shared/components/list/list-types/cf-orgs/cf-orgs-list-config.service';
import { CfOrgCardComponent } from '../../../../shared/components/list/list-types/cf-orgs/cf-org-card/cf-org-card.component';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { tap } from 'rxjs/operators';
@Component({
  selector: 'app-cloud-foundry-organizations',
  templateUrl: './cloud-foundry-organizations.component.html',
  styleUrls: ['./cloud-foundry-organizations.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfOrgsListConfigService
    }
  ]
})
export class CloudFoundryOrganizationsComponent implements OnInit {
  cardComponent = CfOrgCardComponent;

  constructor(private listConfig: ListConfig<APIResource>) {
    const dataSource: ListDataSource<APIResource> = listConfig.getDataSource();
  }

  ngOnInit() {}
}
