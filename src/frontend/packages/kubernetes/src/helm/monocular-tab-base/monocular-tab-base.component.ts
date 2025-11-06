import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '@stratosui/store';
import { endpointOfTypeSelector } from '@stratosui/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { PageHeaderComponent } from '@stratosui/core';
import { HELM_ENDPOINT_TYPE } from '../helm-entity-factory';

@Component({
  selector: 'app-monocular-tab-base',
  templateUrl: './monocular-tab-base.component.html',
  styleUrls: ['./monocular-tab-base.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    RouterOutlet
  ]
})
export class MonocularTabBaseComponent implements OnInit {

  public endpointIds$!: Observable<string[]>;
  private store = inject(Store<AppState>);

  ngOnInit() {
    this.endpointIds$ = this.store.select(endpointOfTypeSelector(HELM_ENDPOINT_TYPE)).pipe(
      map(endpoints => Object.keys(endpoints))
    );
  }
}
