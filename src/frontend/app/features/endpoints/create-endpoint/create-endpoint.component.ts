import { Component, HostBinding } from '@angular/core';

@Component({
  selector: 'app-create-endpoint',
  templateUrl: './create-endpoint.component.html',
  styleUrls: ['./create-endpoint.component.scss']
})
export class CreateEndpointComponent {
  @HostBinding('class') class = 'router-component';
}
