import { Component } from '@angular/core';
import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { MonocularRepositoryListConfig } from '../../list-types/monocular-repository-list-config.service';

@Component({
  selector: 'app-repository-tab',
  templateUrl: './repository-tab.component.html',
  styleUrls: ['./repository-tab.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: MonocularRepositoryListConfig,
  }]
})
export class RepositoryTabComponent {

}
