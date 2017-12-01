import { ConnectEndpointDialogComponent } from '../connect-endpoint-dialog/connect-endpoint-dialog.component';
import { CNSISModel } from '../../../store/types/cnsis.types';
import { ListConfig } from '../../../shared/components/list/list.component';
import { EndpointsListConfigService } from '../../../shared/list-configs/endpoints-list-config.service';
import { Component } from '@angular/core';

function getEndpointTypeString(endpoint: CNSISModel): string {
  return endpoint.cnsi_type === 'cf' ? 'Cloud Foundry' : endpoint.cnsi_type;
}

@Component({
  selector: 'app-endpoints-page',
  templateUrl: './endpoints-page.component.html',
  styleUrls: ['./endpoints-page.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: EndpointsListConfigService,
  }]
})
export class EndpointsPageComponent {
}
