import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-add-space',
  templateUrl: './add-space.component.html',
  styleUrls: ['./add-space.component.scss']
})
export class AddSpaceComponent implements OnInit {

  ogrSpacesUrl: string;
  constructor(
    private activatedRoute: ActivatedRoute
  ) {
    const cfId = activatedRoute.snapshot.params.cfId;
    const orgId = activatedRoute.snapshot.params.orgId;
    this.ogrSpacesUrl = `/cloud-foundry/${cfId}/organizations/${orgId}/spaces`;
  }

  ngOnInit() {
  }

}
