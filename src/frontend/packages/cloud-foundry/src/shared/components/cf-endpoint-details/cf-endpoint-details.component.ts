import { Component , ChangeDetectionStrategy } from '@angular/core';
import { CustomTooltipDirective, EndpointListDetailsComponent } from '@stratosui/core';


@Component({
  selector: 'lib-cf-endpoint-details',
  templateUrl: './cf-endpoint-details.component.html',
  styleUrls: ['./cf-endpoint-details.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CustomTooltipDirective
]
})
export class CfEndpointDetailsComponent extends EndpointListDetailsComponent { }
