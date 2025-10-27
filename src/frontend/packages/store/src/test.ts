// This file is required by karma.conf.js and loads recursively all the .spec and framework files
import 'core-js/es/reflect';
import 'zone.js';
import 'zone.js/testing';

import { APP_BASE_HREF } from '@angular/common';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';



// Angular CLI automatically discovers and loads tests based on tsconfig.spec.json include patterns
// No need for manual require.context() in Angular 20+
