import { Type } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Schema, schema } from 'normalizr';

// Allowable endpoint types
export type EndpointType = 'cf' | 'metrics' | string;

export interface EndpointAuthTypeConfig {
  name: string;
  value: string;
  formType?: string;
  types: Array<EndpointType>;
  form?: any;
  data?: any;
  component: Type<IAuthForm>;
  help?: string;
  /**
   * Generic property for any additional config
   */
  config?: any;
}

/**
 * Interface that an Endpoint Auth Form Component must implement
 */
export interface IAuthForm {
  formGroup: FormGroup;
  /**
   * Generic property for any additional config
   */
  config?: any;
}

export interface EndpointAuthValues { [key: string]: string; }

/**
 * Optional interface that an Endpoint Auth Form Component can implement
 * if it needs to supply content in the request body when connecting an endppoint
 * e.g. if it needs to send a config file
 */
export interface IEndpointAuthComponent extends IAuthForm {
  // Allows auth type to override which values are sent to the backend when connecting
  getValues(values: EndpointAuthValues): EndpointAuthValues;  // Map of values to send
  getBody(): string;  // Get the body contents to send
}

export interface ExtensionEntitySchema {
  entityKey: string;
  definition?: Schema;
  options?: schema.EntityOptions;
  relationKey?: string;
}
