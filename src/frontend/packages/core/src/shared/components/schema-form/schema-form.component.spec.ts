import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MaterialDesignFrameworkModule } from 'stratos-angular6-json-schema-form';

import { BaseTestModulesNoShared } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { SchemaFormComponent } from './schema-form.component';

describe('BindServiceAppFormComponent', () => {
  let component: SchemaFormComponent;
  let fixture: ComponentFixture<SchemaFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SchemaFormComponent
      ],
      imports: [
        BaseTestModulesNoShared,
        MaterialDesignFrameworkModule
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
