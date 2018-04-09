import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModulesNoShared } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import {
  ApplicationStateIconComponent,
} from '../../../application-state/application-state-icon/application-state-icon.component';
import { CompactAppCardComponent } from './compact-app-card.component';
import { ApplicationStateIconPipe } from '../../../application-state/application-state-icon/application-state-icon.pipe';
import { ApplicationStateService } from '../../../application-state/application-state.service';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';

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
      imports: [...BaseTestModulesNoShared],
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
