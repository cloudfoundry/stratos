import { Component, EnvironmentInjector, Injector, OnDestroy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormBuilder, UntypedFormGroup } from '@angular/forms';
import { describe, it, expect, beforeEach } from 'vitest';

import { IAuthForm } from '../../../../store/src/extension-types';
import { KubeConfigAuthHelper } from './kube-config-auth.helper';
import { KubeConfigFileUser } from './kube-config.types';

let destroyed = 0;

// An auth form that offers body content but fails to build its values.
@Component({ selector: 'app-failing-auth-form', template: '', standalone: true })
class FailingAuthFormComponent implements IAuthForm, OnDestroy {
  formGroup = new UntypedFormGroup({});
  getBody() { return ''; }
  getValues(): never { throw new Error('bad values'); }
  ngOnDestroy() { destroyed += 1; }
}

describe('KubeConfigAuthHelper', () => {
  let helper: KubeConfigAuthHelper;
  const user = {
    name: 'admin',
    user: {},
    _authData: { authType: 'failing', subType: '', values: {} },
  } as unknown as KubeConfigFileUser;

  beforeEach(() => {
    destroyed = 0;
    helper = new KubeConfigAuthHelper();
    helper.authTypes = { failing: { value: 'failing', name: 'Failing', form: {}, types: [], component: FailingAuthFormComponent } };
  });

  it('destroys the auth form when it fails to build the connect data', () => {
    expect(() => helper.getAuthDataForConnect(
      TestBed.inject(EnvironmentInjector), TestBed.inject(Injector), new FormBuilder(), user,
    )).toThrow('bad values');
    expect(destroyed).toBe(1);
  });
});
