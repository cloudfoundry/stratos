import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';

import { CATALOGUE_ENTITIES, entityCatalog, generateStratosEntities, TestEntityCatalog } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities } from '../../../../cf-entity-generator';
import { CfDeployAppDataService } from '../../../../services/domain-data/cf-deploy-app-data.service';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { OverrideAppDetails, SocketEventTypes, SourceType } from '../../../../store/types/deploy-application.types';
import { FileScannerInfo } from '../deploy-application-step2/deploy-application-fs/deploy-application-fs-scanner';
import { DeployApplicationStepSourceUploadComponent } from "./deploy-application-step-source-upload.component";

// Each connection gets a server stream the test drives; what the client
// sends is recorded, in all and by connection
const socket = vi.hoisted(() => ({
  server: undefined as any, connections: 0, sent: [] as unknown[], sentOn: [] as unknown[][],
}));
vi.mock('rxjs-websockets', () => ({
  default: () => {
    socket.connections++;
    socket.server = new Subject<string>();
    return of((input: Observable<unknown>) => {
      const sentHere: unknown[] = [];
      socket.sentOn.push(sentHere);
      input.subscribe(m => {
        socket.sent.push(m);
        sentHere.push(m);
      });
      return socket.server;
    });
  },
}));

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
    let closeSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      // Enter with the deploy target set, so the deployer connects
      TestBed.inject(CfDeployAppDataService).setCfDetails({ cloudFoundry: 'cf', org: 'org', space: 'space' });
      component.onEnter({} as FileScannerInfo);
      await TestBed.inject(ApplicationRef).whenStable();
      closeSpy = vi.spyOn(component.deployer, 'close');
    });

    it('closes the deployer while only the upload has run', () => {
      fixture.destroy();
      expect(closeSpy).toHaveBeenCalled();
    });

    it('closes a handed-on deployer the deploy step never started', () => {
      component.onNext(0, null as any).subscribe();
      fixture.destroy();
      expect(closeSpy).toHaveBeenCalled();
    });

    it('leaves the deployer open once the deploy step started it, before the push', () => {
      component.onNext(0, null as any).subscribe();
      component.deployer.deploy();
      fixture.destroy();
      expect(closeSpy).not.toHaveBeenCalled();
      component.deployer.close();
    });

    it('closes a started deploy that has finished', () => {
      component.onNext(0, null as any).subscribe();
      component.deployer.deploy();
      component.deployer.processWebSocketMessage({ type: SocketEventTypes.CLOSE_FAILURE, message: 'boom' });
      fixture.destroy();
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('coming back to the step', () => {
    const fromServer = (type: SocketEventTypes, message = '') => socket.server.next(JSON.stringify({ type, message }));
    const oneFile = () => ({ root: { files: [new File(['x'], 'a.txt')] }, total: 1 } as unknown as FileScannerInfo);
    let appRef: ApplicationRef;

    beforeEach(() => {
      appRef = TestBed.inject(ApplicationRef);
      socket.connections = 0;
      socket.sent = [];
      socket.sentOn = [];
      const deployData = TestBed.inject(CfDeployAppDataService);
      deployData.setCfDetails({ cloudFoundry: 'cf', org: 'org', space: 'space' });
      deployData.setSourceType({ id: 'file', name: 'File' } as SourceType);
    });

    // Upload the one file: the server asks for the source, then
    // acknowledges the name and the data
    const upload = async () => {
      fromServer(SocketEventTypes.SOURCE_REQUIRED);
      fromServer(SocketEventTypes.SOURCE_FILE_ACK);
      await vi.waitFor(() => expect(socket.sent.some(m => m instanceof ArrayBuffer)).toBe(true));
      fromServer(SocketEventTypes.SOURCE_FILE_ACK);
    };

    it('uploads again after the deploy ended', async () => {
      component.onEnter(oneFile());
      await appRef.whenStable();
      expect(socket.connections).toBe(1);
      component.onNext(0, null as any).subscribe();
      component.deployer.deploy();
      fromServer(SocketEventTypes.CLOSE_FAILURE, 'boom');
      expect(component.deployer.finished).toBe(true);

      // Previous through the overrides step; the wizard passes no file info
      component.onEnter(undefined as any);
      await appRef.whenStable();

      expect(socket.connections).toBe(2);
      expect(component.deployer.finished).toBe(false);
      expect(component.deployer.status$().error).toBe(false);
      component.deployer.close();
    });

    it('shows no earlier upload after Previous', async () => {
      const valid: boolean[] = [];
      component.valid$.subscribe(v => valid.push(v));
      component.onEnter(oneFile());
      await appRef.whenStable();
      await upload();
      expect(valid.at(-1)).toBe(true);

      component.onLeave(false);
      component.onEnter(oneFile());
      await appRef.whenStable();

      expect(component.deployer.fileTransferStatus$()).toBeUndefined();
      expect(valid.at(-1)).toBe(false);
      // A new subscriber (the wizard's, say) sees no completed upload either
      const later: boolean[] = [];
      component.valid$.subscribe(v => later.push(v)).unsubscribe();
      expect(later).not.toContain(true);
      component.deployer.close();
    });

    describe('with a file read still running', () => {
      let reader: FileReader | undefined;
      let read: ReturnType<typeof vi.spyOn>;
      // The read the first upload started finishes now
      const finishRead = () => {
        Object.defineProperty(reader, 'result', { value: new ArrayBuffer(1) });
        reader!.onload!({} as ProgressEvent<FileReader>);
      };

      beforeEach(async () => {
        read = vi.spyOn(FileReader.prototype, 'readAsArrayBuffer').mockImplementation(() => undefined);
        component.onEnter(oneFile());
        await appRef.whenStable();
        fromServer(SocketEventTypes.SOURCE_REQUIRED);
        fromServer(SocketEventTypes.SOURCE_FILE_ACK);
        reader = read.mock.contexts.at(-1) as FileReader | undefined;
        expect(reader).toBeDefined();
      });

      afterEach(() => {
        read.mockRestore();
        component.deployer.close();
      });

      // Previous, then back: the upload starts again on a new connection
      const reenter = () => {
        component.onLeave(false);
        component.onEnter(oneFile());
      };

      // The new upload asks for the source and acknowledges the file name;
      // the first file is not sent yet
      const startNewUpload = () => {
        expect(socket.connections).toBe(2);
        fromServer(SocketEventTypes.SOURCE_REQUIRED);
        fromServer(SocketEventTypes.SOURCE_FILE_ACK);
        expect(socket.sentOn[1].some(m => m instanceof ArrayBuffer)).toBe(false);
        expect(component.deployer.fileTransferStatus$()?.filesSent).toBe(0);
      };

      it('drops a read that finishes after the new connection opened', async () => {
        reenter();
        await appRef.whenStable();
        finishRead();

        startNewUpload();
      });

      it('drops a read that finishes while the new connection opens', async () => {
        reenter();
        finishRead();
        await appRef.whenStable();

        startNewUpload();
      });
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
    deployer.deploy();
    fixture.destroy();
    deployData.saveAppOverrides(overrides('second'));
    await appRef.whenStable();

    expect(deployer.applicationOverrides.name).toBe('second');
    deployer.close();
  });
});
