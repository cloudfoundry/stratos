import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { NEVER } from 'rxjs';

import { CATALOGUE_ENTITIES, entityCatalog, generateStratosEntities, TestEntityCatalog } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities } from '../../../../cf-entity-generator';
import { CfDeployAppDataService } from '../../../../services/domain-data/cf-deploy-app-data.service';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { OverrideAppDetails } from '../../../../store/types/deploy-application.types';
import { FileScannerInfo } from '../deploy-application-step2/deploy-application-fs/deploy-application-fs-scanner';
import { DeployApplicationStepSourceUploadComponent } from "./deploy-application-step-source-upload.component";

vi.mock('rxjs-websockets', () => ({ default: () => NEVER }));

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

  it('keeps the deployer following the deploy state after the step is gone', async () => {
    // The deploy step keeps this deployer, and after the user leaves the
    // page mid-push it still waits on it for the completion notice
    const appRef = TestBed.inject(ApplicationRef);
    const deployData = TestBed.inject(CfDeployAppDataService);
    const overrides = (name: string) => ({ name } as OverrideAppDetails);
    deployData.setCfDetails({ cloudFoundry: 'cf', org: 'org', space: 'space' });
    deployData.saveAppOverrides(overrides('first'));
    component.onEnter({} as FileScannerInfo);
    await appRef.whenStable();
    expect(component.deployer.applicationOverrides.name).toBe('first');

    const deployer = component.deployer;
    deployer.deploying = true;
    fixture.destroy();
    deployData.saveAppOverrides(overrides('second'));
    await appRef.whenStable();

    expect(deployer.applicationOverrides.name).toBe('second');
    deployer.close();
  });
});
