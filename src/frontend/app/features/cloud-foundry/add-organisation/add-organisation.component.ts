import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-add-organisation',
  templateUrl: './add-organisation.component.html',
  styleUrls: ['./add-organisation.component.scss']
})
export class AddOrganisationComponent implements OnInit {

  cfUrl: string;
  constructor(
    private activatedRoute: ActivatedRoute
  ) {
    const { cfId } = activatedRoute.snapshot.params;
    this.cfUrl = `/cloud-foundry/${cfId}/organizations`;
  }

  ngOnInit() {
  }

}
