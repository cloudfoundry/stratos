import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../../../../core/core.module';
import { SharedModule } from '../../../../../../shared/shared.module';
import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';
import { ActiveRouteCfOrgSpace } from '../../../../cf-page.types';
import { SpaceRolesListWrapperComponent } from './space-roles-list-wrapper.component';


describe('SpaceRolesListWrapperComponent', () => {
  let component: SpaceRolesListWrapperComponent;
  let fixture: ComponentFixture<SpaceRolesListWrapperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        // CloudFoundryModule
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
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
