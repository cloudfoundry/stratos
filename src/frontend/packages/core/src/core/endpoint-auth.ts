import { Validators } from '@angular/forms';

import { EndpointAuthTypeConfig, EndpointType } from '../../../store/src/extension-types';
import {
    CredentialsAuthFormComponent,
} from '../features/endpoints/connect-endpoint-dialog/auth-forms/credentials-auth-form.component';
import { NoneAuthFormComponent } from '../features/endpoints/connect-endpoint-dialog/auth-forms/none-auth-form.component';
import { SSOAuthFormComponent } from '../features/endpoints/connect-endpoint-dialog/auth-forms/sso-auth-form.component';
import {
    TokenEndpointComponent,
} from '../features/endpoints/connect-endpoint-dialog/auth-forms/token-endpoint/token-endpoint.component';

export enum EndpointAuthTypeNames {
  CREDS = 'creds',
  TOKEN = 'bearer',// TODO: RC
  SSO = 'sso',
  NONE = 'none'
}

export abstract class BaseEndpointAuth {
  static readonly UsernamePassword: EndpointAuthTypeConfig = {
    name: 'Username and Password',
    value: EndpointAuthTypeNames.CREDS,
    form: {
      username: ['', Validators.required],
      password: ['', Validators.required],
    },
    types: new Array<EndpointType>(),
    component: CredentialsAuthFormComponent,
  };
  static readonly Token: EndpointAuthTypeConfig = {
    name: 'Token',
    value: EndpointAuthTypeNames.TOKEN,
    form: {
      token: ['', Validators.required],
    },
    types: new Array<EndpointType>(),
    component: TokenEndpointComponent
  };

  static readonly SSO: EndpointAuthTypeConfig = {
    name: 'Single Sign-On (SSO)',
    value: EndpointAuthTypeNames.SSO,
    form: {},
    types: new Array<EndpointType>(),
    component: SSOAuthFormComponent
  };

  static readonly None: EndpointAuthTypeConfig = {
    name: 'No Authentication',
    value: EndpointAuthTypeNames.NONE,
    form: {},
    types: new Array<EndpointType>(),
    component: NoneAuthFormComponent
  };
}
