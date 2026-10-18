import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { CATALOGUE_ENTITIES, entityCatalog, generateStratosEntities, TestEntityCatalog } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities } from '../../../../cf-entity-generator';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { FileScannerInfo } from '../deploy-application-step2/deploy-application-fs/deploy-application-fs-scanner';
import { DeployApplicationStepSourceUploadComponent } from "./deploy-application-step-source-upload.component";

describe('DeployApplicationStepSourceUploadComponent', () => {
  let component: DeployApplicationStepSourceUploadComponent;
  let fixture: ComponentFixture<DeployApplicationStepSourceUploadComponent>;

  beforeEach(async () => {
    // Initialize entity catalog with CF entities
    const testEntityCatalog = entityCatalog as TestEntityCatalog;
    testEntityCatalog.clear();
    const entities = [
      ...generateCFEntities(),
      ...generateStratosEntities()
    ];
    entities.forEach(entity => testEntityCatalog.register(entity));

    await TestBed.configureTestingModule({
      imports: [
        DeployApplicationStepSourceUploadComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        {
          provide: CATALOGUE_ENTITIES,
          useValue: entities,
          multi: true
        },
        CfOrgSpaceDataService,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeployApplicationStepSourceUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('deployer ownership on destroy', () => {
    const fileInfo = {} as FileScannerInfo;
    let closeSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      vi.spyOn(component.deployer, 'open').mockImplementation(() => {});
      closeSpy = vi.spyOn(component.deployer, 'close');
    });

    it('closes the deployer when no push is running', () => {
      component.onEnter(fileInfo);
      fixture.destroy();
      expect(closeSpy).toHaveBeenCalled();
    });

    it('closes a handed-on deployer the deploy step never started', () => {
      component.onEnter(fileInfo);
      component.onNext(0, null as any).subscribe();
      fixture.destroy();
      expect(closeSpy).toHaveBeenCalled();
    });

    it('leaves the deployer open while its push is running', () => {
      component.onEnter(fileInfo);
      component.onNext(0, null as any).subscribe();
      component.deployer.deploying = true;
      fixture.destroy();
      expect(closeSpy).not.toHaveBeenCalled();
    });
  });
});
