import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';

import { entityCatalogue } from '../../../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import {
  AppMonitorComponentTypes,
} from '../../../../../../core/src/shared/components/app-action-monitor-icon/app-action-monitor-icon.component';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { cfEntityFactory } from '../../../../cf-entity-factory';
import { organizationEntityType, spaceEntityType } from '../../../../cf-entity-types';
import { AddOrganizationService } from '../add-organization.service';

@Component({
  selector: 'app-add-organization-confirm',
  templateUrl: './add-organization-confirm.component.html',
  styleUrls: ['./add-organization-confirm.component.scss']
})
export class AddOrganizationConfirmComponent implements OnInit {

  createData = new BehaviorSubject(null);

  constructor(
    private addOrgService: AddOrganizationService
  ) {
    this.create = {
      columns: [{
        headerCell: () => 'Name',
        columnId: 'name',
        cellDefinition: {
          // getValue: row => {
          //   console.log(row);
          //   return (row || { name: 'junk' }).name;
          // }
          valuePath: 'name'
        },
        cellFlex: '1'
      }, {
        headerCell: () => 'Action',
        columnId: 'action',
        cellDefinition: {
          getValue: () => 'Create'
          // valuePath: 'name'
        },
        cellFlex: '1'
      }
      ],
      changes$: this.createData.asObservable(), // : Observable<CfRoleChangeWithNames[]>
      schemaKey: organizationEntityType,
      monitorState: AppMonitorComponentTypes.CREATE,
      getCellConfig: () => {
        const isSpace = false;
        // TODO: RC
        const schema = isSpace ? cfEntityFactory(spaceEntityType) : cfEntityFactory(organizationEntityType);
        return {
          entityKey: schema.key,
          schema,
          monitorState: AppMonitorComponentTypes.CREATE,
          // updateKey: ChangeUserRole.generateUpdatingKey(row.role, row.userGuid),
          getId: () => this.addOrgService.orgDetails.name
        };
      }
    };
  }

  public create;
  public orgCatalogueEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, organizationEntityType);

  // startApply: () => {

  // },
  applyStarted = false;
  table = {
    columns: [],
    changes$: null,
    userSchemaKey: '',
    monitorState: null,
    getCellConfig: () => {

    }
  };

  ngOnInit() {


  }

  onEnter = () => {
    this.createData.next([this.addOrgService.orgDetails]);


    return of({
      success: true
    });
  }

}
