import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  ApplicationStateIconComponent,
} from '../../../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.component';
import {
  ApplicationStateIconPipe,
} from '../../../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.pipe';
import { generateCfBaseTestModulesNoShared } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { ApplicationStateService } from '../../../../services/application-state.service';
import { CompactAppCardComponent } from './compact-app-card.component';

describe('CompactAppCardComponent', () => {
  let component: CompactAppCardComponent;
  let fixture: ComponentFixture<CompactAppCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CompactAppCardComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe
      ],
      imports: generateCfBaseTestModulesNoShared(),
      providers: [
        ApplicationStateService,
        ActiveRouteCfOrgSpace
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompactAppCardComponent);
    component = fixture.componentInstance;
    component.app = {
      entity: {},
      metadata: {}
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
