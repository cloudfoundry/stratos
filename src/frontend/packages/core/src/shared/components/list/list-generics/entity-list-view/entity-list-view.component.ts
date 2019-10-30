import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { ListEntityConfig } from '../helpers/action-or-config-helpers';
import { ListConfigProvider } from '../list-config-provider.types';
import { EntityConfigListConfigProvider } from '../list-providers/entity-config-list-config-provider';

@Component({
  selector: 'app-entity-list-view',
  templateUrl: './entity-list-view.component.html',
  styleUrls: ['./entity-list-view.component.scss']
})
export class EntityListViewComponent implements OnInit {
  @Input()
  public config: ListEntityConfig;

  provider: ListConfigProvider;

  constructor(private store: Store<any>) { }

  ngOnInit() {
    this.provider = new EntityConfigListConfigProvider(this.store, this.config);
  }
}
