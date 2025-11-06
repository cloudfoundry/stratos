import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { generateCfBaseTestModulesNoShared } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { SchemaFormComponent } from './schema-form.component';
import { TailwindJsonSchemaFormModule } from '../../../../../core/src/shared/components/tailwind-json-schema-form/tailwind-json-schema-form.module';

describe('SchemaFormComponent', () => {
  let component: SchemaFormComponent;
  let fixture: ComponentFixture<SchemaFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...generateCfBaseTestModulesNoShared(),
        SchemaFormComponent,
        TailwindJsonSchemaFormModule
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
