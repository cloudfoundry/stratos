import { Component, OnInit } from '@angular/core';

import { IHeaderBreadcrumb } from '../../../shared/components/page-header/page-header.types';

@Component({
  selector: 'app-service-catalogue-page',
  templateUrl: './service-catalogue-page.component.html',
  styleUrls: ['./service-catalogue-page.component.scss']
})
export class ServiceCataloguePageComponent implements OnInit {
  breadcrumbs: IHeaderBreadcrumb[];
  constructor() {
    this.breadcrumbs = [
      {
        breadcrumbs: [
          {
            value: 'test',
            routerLink: '/applications'
          },
          {
            value: 'Apps',
            routerLink: '/applications'
          }
        ]
      },
      {
        key: 'test',
        breadcrumbs: [
          {
            value: 'Param1',
            routerLink: '/applications'
          },
          {
            value: 'Param2',
            routerLink: '/applications'
          }
        ]
      }
    ];
  }

  ngOnInit() {
  }

}
