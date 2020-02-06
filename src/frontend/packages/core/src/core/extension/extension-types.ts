import { Type } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Schema, schema } from 'normalizr';

// Allowable endpoint types
export type EndpointType = 'cf' | 'metrics' | string;

// interface BaseEndpointTypeConfig {
// type?: EndpointType;
// subType?: string;
// label: string;
// urlValidation?: string;
// allowTokenSharing?: boolean;
// icon?: string;
// iconFont?: string;
// imagePath?: string;
// authTypes?: string[];
// /**
//  * Get the link to the home page for the given endpoint GUID
//  */
// homeLink?: (s) => string[];
// /**
//  * Schema keys associated with this endpoint type (used when clearing pagination)
//  */
// entitySchemaKeys?: string[];
// /**
//  * Show custom content in the endpoints list. Should be Type<EndpointListDetailsComponent>
//  */
// listDetailsComponent?: any;
// /**
//  * When all endpoints are displayed together use the order to define the position. Lower number = earlier position
//  */
// order?: number;
// /**
//  * Indicates if this endpoint types can not be connected (optional - default is false)
//  */
// doesNotSupportConnect?: boolean;
// /**
//  * Indicates if this endpoint type is in tech preview and should only be shown when tech preview mode is enabled
//  */
// techPreview?: boolean;

// }

/**
 * Configuration for an endpoint type used to defined endpoints via extensions and at runtime. All EndpointTypeExtensionConfig and their
 * subtypes will be in a flat list of this type
 */
// export interface EndpointTypeConfig extends BaseEndpointTypeConfig {
//   type: EndpointType;
// }

// /**
//  * Configuration for an endpoint sub type extension
//  */
// interface EndpointSubTypeExtensionConfig extends BaseEndpointTypeConfig {
//   subType: string;
// }

/**
 * Configuration for an endpoint type extension
 */
// export interface EndpointTypeExtensionConfig extends EndpointTypeConfig {
//   subTypes?: EndpointSubTypeExtensionConfig[];
// }
export interface EndpointAuthTypeConfig {
  name: string;
  value: string;
  formType?: string;
  types: Array<EndpointType>;
  form?: any;
  data?: any;
  component: Type<IAuthForm>;
  help?: string;
}

/**
 * Interface that an Endpoint Auth Form Component must implement
 */
export interface IAuthForm {
  formGroup: FormGroup;
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
