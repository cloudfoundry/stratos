import { Component } from '@angular/core';

@Component({
  selector: 'app-monocular-tab-base',
  templateUrl: './monocular-tab-base.component.html',
  styleUrls: ['./monocular-tab-base.component.scss']
})
export class MonocularTabBaseComponent {

  tabLinks = [
    { link: 'charts', label: 'Charts', matIcon: 'folder_open' },
    { link: 'repos', label: 'Repositories', matIcon: 'products', matIconFont: 'stratos-icons' },
    { link: 'releases', label: 'Releases', matIcon: 'apps' },
    { link: 'config', label: 'Config', matIcon: 'build' },
  ];

}

