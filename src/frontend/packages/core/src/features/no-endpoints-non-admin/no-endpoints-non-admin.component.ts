import { Component } from '@angular/core';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ProductNameComponent } from '../../shared/components/product-name.ccomponent';
import { ShowPageHeaderComponent } from '../../shared/components/page-header/show-page-header/show-page-header.component';
import { NoContentMessageComponent } from '../../shared/components/no-content-message/no-content-message.component';

@Component({
  selector: 'app-no-endpoints-non-admin',
  templateUrl: './no-endpoints-non-admin.component.html',
  styleUrls: ['./no-endpoints-non-admin.component.scss'],
  standalone: true,
  imports: [
    PageHeaderComponent,
    ProductNameComponent,
    ShowPageHeaderComponent,
    NoContentMessageComponent
  ]
})
export class NoEndpointsNonAdminComponent { }
