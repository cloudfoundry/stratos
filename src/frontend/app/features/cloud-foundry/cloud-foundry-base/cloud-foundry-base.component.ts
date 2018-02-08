import { Component, OnInit } from '@angular/core';
import { EntityService } from '../../../core/entity-service';
import { CloudFoundryService } from '../cloud-foundry.service';

@Component({
  selector: 'app-cloud-foundry-base',
  templateUrl: './cloud-foundry-base.component.html',
  styleUrls: ['./cloud-foundry-base.component.scss'],
  providers: [CloudFoundryService]
})
export class CloudFoundryBaseComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
