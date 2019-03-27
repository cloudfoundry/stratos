import { Component, OnInit } from '@angular/core';
import { UserFavoriteEndpoint, UserFavorite } from '../../../../../store/src/types/user-favorites.types';
import { endpointSchemaKey } from '../../../../../store/src/helpers/entity-factory';

@Component({
  selector: 'app-monocular-tab-base',
  templateUrl: './monocular-tab-base.component.html',
  styleUrls: ['./monocular-tab-base.component.scss']
})
export class MonocularTabBaseComponent implements OnInit {

  tabLinks = [
    { link: 'charts', label: 'Charts', matIcon: 'folder_open' },
    { link: 'repos', label: 'Repositories', matIcon: 'products', matIconFont: 'stratos-icons' },
    { link: 'releases', label: 'Releases', matIcon: 'apps' },
    { link: 'config', label: 'Config', matIcon: 'build' },
  ];

  public favorite = new UserFavorite('JPuffnBo2-DH_5ATdrbBlh-08xc', 'helm', endpointSchemaKey, null, {
    guid: 'JPuffnBo2-DH_5ATdrbBlh-08xc',
    name: 'Test',
  });

  constructor() { }

  ngOnInit() { }

}
