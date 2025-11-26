import { Component } from '@angular/core';
import { CardComponent, MetadataItemComponent } from '@stratosui/core';

@Component({
selector: 'app-acme-support-info',
  templateUrl: './acme-support-info.component.html',
  styleUrls: ['./acme-support-info.component.scss'],
  standalone: true,
  imports: [
    CardComponent,
    MetadataItemComponent
  ]
})
export class AcmeSupportInfoComponent {

}
