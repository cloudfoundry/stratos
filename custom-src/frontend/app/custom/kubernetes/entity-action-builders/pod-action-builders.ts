import { OrchestratedActionBuilders } from '../../../core/entity-catalogue/action-orchestrator/action-orchestrator';
import { GetKubernetesPods } from '../store/kubernetes.actions';

export interface PodActionBuilders extends OrchestratedActionBuilders {
  getMultiple: () => GetKubernetesPods;
};

export const podActionBuilders: OrchestratedActionBuilders = {
  getMultiple: (kubeGuid: string) => new GetKubernetesPods(kubeGuid)
};


