import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MaterialDesignFrameworkModule } from '@ajsf/material';

import { generateCfBaseTestModulesNoShared } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { SchemaFormComponent } from './schema-form.component';

describe('SchemaFormComponent', () => {
  let component: SchemaFormComponent;
  let fixture: ComponentFixture<SchemaFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        SchemaFormComponent
      ],
      imports: [
        ...generateCfBaseTestModulesNoShared(),
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
