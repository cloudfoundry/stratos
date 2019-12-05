import { InjectionToken, Injectable } from '@angular/core';
import { EntityService } from '../core/entity-service';
export const CF_GUID = new InjectionToken<string>('cfGuid');
export const APP_GUID = new InjectionToken<string>('appGuid');

export const ENTITY_SERVICE = new InjectionToken<EntityService>(null);
