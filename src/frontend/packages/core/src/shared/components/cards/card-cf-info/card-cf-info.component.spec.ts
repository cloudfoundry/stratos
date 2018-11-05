import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  BaseTestModulesNoShared,
  generateTestCfEndpointService,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { BooleanIndicatorComponent } from '../../boolean-indicator/boolean-indicator.component';
import { MetadataItemComponent } from '../../metadata-item/metadata-item.component';
import { CardCfInfoComponent } from './card-cf-info.component';

describe('CardCfInfoComponent', () => {
  let component: CardCfInfoComponent;
  let fixture: ComponentFixture<CardCfInfoComponent>;
  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [CardCfInfoComponent, MetadataItemComponent, BooleanIndicatorComponent],
        imports: [...BaseTestModulesNoShared],
        providers: [generateTestCfEndpointService()]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCfInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
