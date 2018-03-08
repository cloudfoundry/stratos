import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-edit-organization',
  templateUrl: './edit-organization.component.html',
  styleUrls: ['./edit-organization.component.scss']
})
export class EditOrganizationComponent implements OnInit {

  orgUrl: string;

  constructor(private activatedRoute: ActivatedRoute) {
    const { cfId, orgId } = activatedRoute.snapshot.params;
    this.orgUrl = `/cloud-foundry/${cfId}/organizations/${orgId}`;
  }

  ngOnInit() {
  }

}
