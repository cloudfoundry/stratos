import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { EndpointsDataService } from '@stratosui/store';
import {
  EndpointsSignalConfigService,
} from '../../../../../core/src/features/endpoints/endpoints-page/endpoints-signal-config.service';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubeConfigAuthHelper } from '../kube-config-auth.helper';
import { KubeConfigFileCluster } from '../kube-config.types';
import { KubeConfigImportComponent } from './kube-config-import.component';

function makeStubEndpointsSignalConfig() {
  return {
    // Only the methods kube-config-import touches need stubs; the rest of
    // the service's signal/computed surface is not read by this component.
    register: vi.fn().mockResolvedValue({ busy: false, error: false, message: 'new-endpoint-guid' }),
    unregister: vi.fn().mockResolvedValue({ busy: false, error: false, message: '' }),
  };
}

function makeCluster(name: string): KubeConfigFileCluster {
  return {
    name,
    cluster: {
      'certificate-authority': '',
      'certificate-authority-data': '',
      'insecure-skip-tls-verify': true,
      server: `https://${name}.example.com`,
    },
    _user: 'admin',
    // A cert user, with the auth data parseAuth() gives it
    _users: [{
      name: 'admin',
      user: { 'client-certificate-data': 'cert', 'client-key-data': 'key' },
      _authData: { authType: 'kube-cert-auth', subType: '', values: { cert: 'cert', certKey: 'key' } },
    }],
    _selected: true,
    _invalid: false,
    _state: undefined as any,
    _status: '',
    _guid: '',
    _additionalUserInfo: false,
    _id: name,
  };
}

// Row wrappers are typed as Subject-or-signal; these are signal wrappers.
const read = (wrapper: unknown) => (wrapper as () => unknown)();

const AUTH_DATA = { authType: 'kube-cert-auth', authVal: { cert: 'cert', certKey: 'key' }, systemShared: false, bodyContent: '' };

// Taken before any test spies on it, so a spy can still defer to it.
const realGetAuthData = KubeConfigAuthHelper.prototype.getAuthDataForConnect;

describe('KubeConfigImportComponent', () => {
  let component: KubeConfigImportComponent;
  let fixture: ComponentFixture<KubeConfigImportComponent>;
  let stubSignalConfig: ReturnType<typeof makeStubEndpointsSignalConfig>;

  beforeEach(async () => {
    stubSignalConfig = makeStubEndpointsSignalConfig();
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: EndpointsSignalConfigService, useValue: stubSignalConfig },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { endpointId: 'test' },
              queryParams: {}
            }
          }
        }
      ],
      imports: [
        ...KubernetesBaseTestModules,

        KubeConfigImportComponent,
      ]}).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(KubeConfigImportComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('import of several clusters', () => {
    let connect: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      connect = vi.fn().mockResolvedValue({ busy: false, error: false, message: '' });
      vi.spyOn(TestBed.inject(EndpointsDataService), 'connect').mockImplementation(connect as any);
    });

    async function runImport(clusters: KubeConfigFileCluster[]) {
      component.onEnter(clusters);
      const actions = [...component.data()];
      component.onNext(1, undefined as any);
      await vi.waitFor(() => expect(component.done()).toBe(true));
      await fixture.whenStable();
      return actions;
    }

    it('connects each cluster and moves on to the next', async () => {
      vi.spyOn(KubeConfigAuthHelper.prototype, 'getAuthDataForConnect').mockReturnValue(AUTH_DATA as any);

      const actions = await runImport([makeCluster('a'), makeCluster('b')]);

      expect(actions.map(a => a.action)).toEqual([
        'Register endpoint', 'Connect endpoint', 'Register endpoint', 'Connect endpoint',
      ]);
      expect(read(actions[1].actionState)).toEqual({ busy: false, error: false, completed: true, message: '' });
      expect(stubSignalConfig.register).toHaveBeenCalledTimes(2);
      expect(connect).toHaveBeenCalledTimes(2);
      expect(component.busy()).toBe(false);
    });

    it('marks a failed connect and still imports the next cluster', async () => {
      vi.spyOn(KubeConfigAuthHelper.prototype, 'getAuthDataForConnect').mockReturnValue(AUTH_DATA as any);
      connect.mockRejectedValueOnce(new Error('connect blew up'));

      const actions = await runImport([makeCluster('a'), makeCluster('b')]);

      expect(read(actions[1].actionState)).toMatchObject({ error: true, completed: true });
      expect(read(actions[1].state)).toEqual({ message: 'connect blew up', error: true });
      expect(stubSignalConfig.register).toHaveBeenCalledTimes(2);
      expect(connect).toHaveBeenCalledTimes(2);
    });

    it('shows a fallback when a connect fails without a message', async () => {
      vi.spyOn(KubeConfigAuthHelper.prototype, 'getAuthDataForConnect').mockReturnValue(AUTH_DATA as any);
      connect.mockResolvedValueOnce({ busy: false, error: true, message: '' });

      const actions = await runImport([makeCluster('a'), makeCluster('b')]);

      expect(read(actions[1].state)).toEqual({ message: 'Failed to connect endpoint', error: true });
      expect(connect).toHaveBeenCalledTimes(2);
    });

    it('shows a fallback when a connect rejects without a message', async () => {
      vi.spyOn(KubeConfigAuthHelper.prototype, 'getAuthDataForConnect').mockReturnValue(AUTH_DATA as any);
      connect.mockRejectedValueOnce(new Error(''));

      const actions = await runImport([makeCluster('a'), makeCluster('b')]);

      expect(read(actions[1].actionState)).toMatchObject({ error: true, completed: true, message: 'Failed to connect endpoint' });
      expect(read(actions[1].state)).toEqual({ message: 'Failed to connect endpoint', error: true });
      expect(connect).toHaveBeenCalledTimes(2);
    });

    it('moves on when a cluster has no usable auth data', async () => {
      vi.spyOn(KubeConfigAuthHelper.prototype, 'getAuthDataForConnect')
        .mockReturnValueOnce(null)
        .mockReturnValue(AUTH_DATA as any);

      const actions = await runImport([makeCluster('a'), makeCluster('b')]);

      expect(read(actions[1].state)).toEqual({ message: 'Can not connect - could not get user auth data', error: true });
      expect(stubSignalConfig.register).toHaveBeenCalledTimes(2);
      expect(connect).toHaveBeenCalledTimes(1);
    });

    it('marks an unsupported auth type and still imports the next cluster', async () => {
      // The first cluster goes through the real helper with an auth type
      // the kubernetes endpoint does not offer; the second gets usable data.
      vi.spyOn(KubeConfigAuthHelper.prototype, 'getAuthDataForConnect').mockImplementation(function (this: KubeConfigAuthHelper, ...args) {
        return args[3]._authData.authType === 'no-such-auth' ? realGetAuthData.apply(this, args) : AUTH_DATA as any;
      });
      const first = makeCluster('a');
      first._users[0]._authData = { authType: 'no-such-auth', subType: '', values: {} };

      const actions = await runImport([first, makeCluster('b')]);

      expect(read(actions[1].state)).toEqual({ message: 'Unsupported authentication type: no-such-auth', error: true });
      expect(stubSignalConfig.register).toHaveBeenCalledTimes(2);
      expect(connect).toHaveBeenCalledTimes(1);
      expect(read(actions[3].actionState)).toMatchObject({ error: false, completed: true });
    });

    it('skips the connect of a cluster whose register fails without a message', async () => {
      vi.spyOn(KubeConfigAuthHelper.prototype, 'getAuthDataForConnect').mockReturnValue(AUTH_DATA as any);
      stubSignalConfig.register.mockResolvedValueOnce({ busy: false, error: true, message: '' });

      const actions = await runImport([makeCluster('a'), makeCluster('b')]);

      expect(read(actions[0].state)).toEqual({ message: 'Failed to register endpoint', error: true });
      expect(actions[1].action).toBeNull();
      expect(read(actions[1].state)).toEqual({ message: 'Skipping action as endpoint could not be registered', warning: true });
      expect(stubSignalConfig.register).toHaveBeenCalledTimes(2);
      expect(connect).toHaveBeenCalledTimes(1);
      expect(read(actions[3].actionState)).toMatchObject({ error: false, completed: true });
    });
  });
});
