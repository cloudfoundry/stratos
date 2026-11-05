import { ChangeDetectionStrategy, Component, Input, OnInit, input } from '@angular/core';

import { Observable, of } from 'rxjs';

import { getFullEndpointApiUrl } from '../../../../../../store/src/endpoint-utils';
import { EndpointModel } from '../../../../../../store/src/public-api';
import { HomePageCardLayout, HomePageEndpointCard } from '../../home.types';
import { MetadataItemComponent } from '../../../../shared/components/metadata-item/metadata-item.component';
import { UrlPartsPipe } from '../../../../shared/pipes/url-parts.pipe';

@Component({
  selector: 'app-default-endpoint-home-component',
  templateUrl: './default-endpoint-home-component.component.html',
  standalone: true,
  imports: [
    MetadataItemComponent,
    UrlPartsPipe,
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefaultEndpointHomeComponent implements OnInit, HomePageEndpointCard {

  // strict: assigned in ngOnInit before any template read
  url!: string;

  // The home page sets a layout on every card; this one does not use it.
  readonly layout = input<HomePageCardLayout>();

  @Input() endpoint!: EndpointModel;

  ngOnInit(): void {
    this.url = getFullEndpointApiUrl(this.endpoint);
  }

  load(): Observable<boolean> {
    return of(true);
  }
}
