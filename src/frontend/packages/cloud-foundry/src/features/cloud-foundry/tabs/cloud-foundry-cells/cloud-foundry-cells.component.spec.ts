import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { createBasicStoreModule } from '../../../../../../core/test-framework/store-test-helper';
import {
  CfCellsListConfigService,
} from '../../../../shared/components/list/list-types/cf-cells/cf-cells-list-config.service';
import { ActiveRouteCfCell, ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CloudFoundryCellsComponent } from './cloud-foundry-cells.component';

describe('CloudFoundryCellsComponent', () => {
  let component: CloudFoundryCellsComponent;
  let fixture: ComponentFixture<CloudFoundryCellsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryCellsComponent],
      imports: [
        ...BaseTestModules,
        createBasicStoreModule()
      ],
      providers: [
        CfCellsListConfigService,
        {
          provide: ActiveRouteCfCell,
          useFactory: () => ({
            cfGuid: 'cfGuid',
            cellId: 'cellId'
          }),
        },
        CloudFoundryEndpointService,
        ActiveRouteCfOrgSpace
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryCellsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
