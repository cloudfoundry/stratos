import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { entityCatalogue } from '../../../core/entity-catalogue/entity-catalogue.service';

@Component({
  selector: 'app-api-entity-type-select-page',
  templateUrl: './api-entity-type-select-page.component.html',
  styleUrls: ['./api-entity-type-select-page.component.scss']
})
export class ApiEntityTypeSelectPageComponent implements OnInit {

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    const endpointType = this.route.snapshot.params.endpointType;
    // const entityCatalogue
  }

}
