import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../shared.module';
import { CardCfUserInfoComponent } from './card-cf-user-info.component';
import { MetadataItemComponent } from '../../metadata-item/metadata-item.component';
import { CloudFoundryEndpointService } from '../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import {
  generateTestCfEndpointServiceProvider,
  getBaseTestModulesNoShared,
  generateTestCfEndpointService
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { StoreModule } from '@ngrx/store';
import {
  createBasicStoreModule,
  testSCFGuid
} from '../../../../test-framework/store-test-helper';
import { EntityMonitorFactory } from '../../../monitors/entity-monitor.factory.service';
import { getBootstrapListener } from '@angular/router/src/router_module';

describe('CardCfUserInfoComponent', () => {
  let component: CardCfUserInfoComponent;
  let fixture: ComponentFixture<CardCfUserInfoComponent>;
  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [CardCfUserInfoComponent, MetadataItemComponent],
        imports: [...getBaseTestModulesNoShared],
        providers: [generateTestCfEndpointService()]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCfUserInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
