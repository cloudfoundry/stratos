import { NgModule } from '@angular/core';

// Wave-3.5 (slice K-final) drained the @ngrx surface from the kubernetes
// package. KubernetesEffects, AnalysisEffects, and KubernetesReducersModule
// were deleted alongside their consumers' migration to signal-native data
// services (KubeEndpointDataService, KubeAnalysisDataService, etc.).
//
// This module is preserved as an empty NgModule for one slice so any
// cross-package import (kubernetes.setup.module → KubernetesStoreModule)
// keeps compiling. The next slice removes the module entirely along
// with its registration in KubernetesSetupModule.
@NgModule({
  imports: []
})
export class KubernetesStoreModule { }
