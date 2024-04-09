import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../../../../core/src/shared/shared.module';
import { generateCfStoreModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../../../cf-page.types';
import { SpaceRolesListWrapperComponent } from './space-roles-list-wrapper.component';

describe('SpaceRolesListWrapperComponent', () => {
  let component: SpaceRolesListWrapperComponent;
  let fixture: ComponentFixture<SpaceRolesListWrapperComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ...generateCfStoreModules(),
        CoreModule,
        SharedModule,
        NoopAnimationsModule
      ],
      providers: [
        ActiveRouteCfOrgSpace,
      ],
      declarations: [SpaceRolesListWrapperComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpaceRolesListWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
