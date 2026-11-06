import { ChangeDetectionStrategy, Component  } from '@angular/core';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ProductNameComponent } from '../../shared/components/product-name.ccomponent';
import { ShowPageHeaderComponent } from '../../shared/components/page-header/show-page-header/show-page-header.component';
import { NoContentMessageComponent } from '../../shared/components/no-content-message/no-content-message.component';

@Component({
  selector: 'app-no-endpoints-non-admin',
  templateUrl: './no-endpoints-non-admin.component.html',
  standalone: true,
  imports: [
    PageHeaderComponent,
    ProductNameComponent,
    ShowPageHeaderComponent,
    NoContentMessageComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoEndpointsNonAdminComponent { }
