import { Component, OnInit } from '@angular/core';
import { ListConfig, IListConfig, ListViewTypes } from '../../list/list.component.types';
import { ActivatedRoute } from '@angular/router';
import { ActiveRouteCfOrgSpace } from '../../../../features/cloud-foundry/cf-page.types';
import { ListView } from '../../../../store/actions/list.actions';
import { TableCellAppNameComponent } from '../../list/list-types/app/table-cell-app-name/table-cell-app-name.component';
import { APIResource } from '../../../../store/types/api.types';
import { ITableColumn } from '../../list/list-table/table.types';
import { IApp } from '../../../../core/cf-api.types';
import { CfRecentAppsListConfig } from '../../list/list-types/cf-recent-apps/cf-recent-apps-list-config.service';

// const recentAppsListConfigFactory = (ar: ActiveRouteCfOrgSpace) => {
//   console.log('Recent Apps List Config');
//   console.log(ar);
//   //
//   // CfSpaceAppsListConfigService
//   return new CfRecentAppsListConfig(ar)
// };

@Component({
  selector: 'app-card-cf-recent-apps',
  templateUrl: './card-cf-recent-apps.component.html',
  styleUrls: ['./card-cf-recent-apps.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfRecentAppsListConfig,
    }
  ]
})

export class CardCfRecentAppsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}


