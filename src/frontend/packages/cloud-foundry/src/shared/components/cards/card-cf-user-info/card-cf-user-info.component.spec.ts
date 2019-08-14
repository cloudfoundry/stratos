import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataItemComponent } from '../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import {
  generateCfBaseTestModulesNoShared,
  generateTestCfEndpointService,
} from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CardCfUserInfoComponent } from './card-cf-user-info.component';

describe('CardCfUserInfoComponent', () => {
  let component: CardCfUserInfoComponent;
  let fixture: ComponentFixture<CardCfUserInfoComponent>;
  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [CardCfUserInfoComponent, MetadataItemComponent],
        imports: generateCfBaseTestModulesNoShared(),
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
