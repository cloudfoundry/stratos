import { Component, Input, OnInit , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomIconComponent } from '@stratosui/core';
import { StServiceOffering } from '../../../services/endpoint-data/stratos-types';

@Component({
  selector: 'app-service-icon',
  templateUrl: './service-icon.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CustomIconComponent
  ]
})
export class ServiceIconComponent implements OnInit {

  image = '';

  @Input() service!: StServiceOffering | null;
  @Input() addMenuPadding = false;
  constructor() { }

  ngOnInit() {
    // brokerCatalogMetadata is already a decoded map; the V2 path JSON-parsed
    // entity.extra. imageUrl is the only field this component reads.
    const imageUrl = this.service?.brokerCatalogMetadata?.imageUrl;
    if (typeof imageUrl === 'string') {
      this.image = imageUrl;
    }
  }

  imageLoadError() {
    this.image = '';
  }
}
