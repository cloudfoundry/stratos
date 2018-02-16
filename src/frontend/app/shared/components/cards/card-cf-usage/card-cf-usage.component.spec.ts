import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardCfUsageComponent } from './card-cf-usage.component';
import {
  getBaseTestModulesNoShared,
  getBaseTestModules,
  generateTestCfEndpointService
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { MetadataItemComponent } from '../../metadata-item/metadata-item.component';

describe('CardCfUsageComponent', () => {
  let component: CardCfUsageComponent;
  let fixture: ComponentFixture<CardCfUsageComponent>;

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [CardCfUsageComponent, MetadataItemComponent],
        imports: [...getBaseTestModulesNoShared],
        providers: [generateTestCfEndpointService()]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCfUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
