import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cloud-foundry-endpoint-service.helper';

import { ApplicationWallComponent } from './application-wall.component';
describe('ApplicationWallComponent', () => {
  let component: ApplicationWallComponent;
  let fixture: ComponentFixture<ApplicationWallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ApplicationWallComponent,
        ...generateCfBaseTestModulesNoShared(),
      ],
      providers: [
        TabNavService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {},
              queryParams: {}
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationWallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
