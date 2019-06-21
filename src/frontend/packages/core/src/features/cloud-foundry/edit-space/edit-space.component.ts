import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { CloudFoundrySpaceService } from '../services/cloud-foundry-space.service';

@Component({
  selector: 'app-edit-space',
  templateUrl: './edit-space.component.html',
  styleUrls: ['./edit-space.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CloudFoundrySpaceService
  ]
})
export class EditSpaceComponent implements OnInit {

  spaceName$: Observable<string>;
  spaceUrl: string;

  constructor(private cfSpaceService: CloudFoundrySpaceService) {

    this.spaceUrl = '/cloud-foundry/' +
      `${cfSpaceService.cfGuid}/organizations/` +
      `${cfSpaceService.orgGuid}/spaces/` +
      `${cfSpaceService.spaceGuid}/summary`;
    this.spaceName$ = cfSpaceService.space$.pipe(
      map(s => s.entity.entity.name)
    );
  }

  ngOnInit() {
  }

}
