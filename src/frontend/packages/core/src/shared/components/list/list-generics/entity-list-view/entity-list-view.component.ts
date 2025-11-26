import { Component, Input, type OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import type { GeneralEntityAppState } from '@stratosui/store';

import type { ListEntityConfig } from '../helpers/action-or-config-helpers';
import type { ListConfigProvider } from '../list-config-provider.types';
import { EntityConfigListConfigProvider } from '../list-providers/entity-config-list-config-provider';
import { ListViewComponent } from '../list-view/list-view.component';

@Component({
  selector: 'app-entity-list-view',
  templateUrl: './entity-list-view.component.html',
  styleUrls: ['./entity-list-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ListViewComponent
  ]
})
export class EntityListViewComponent implements OnInit {
  @Input()
  public config!: ListEntityConfig;

  provider!: ListConfigProvider;

  private store = inject(Store<GeneralEntityAppState>);

  ngOnInit() {
    this.provider = new EntityConfigListConfigProvider(this.store, this.config);
  }
}
