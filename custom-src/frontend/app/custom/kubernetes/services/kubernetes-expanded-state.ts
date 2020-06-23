import { KubernetesPod } from '../store/kube.types';


export interface KubernetesPodExpandedStatus {
  readyContainers: number;
  totalContainers: number;
  status: string;
  restarts: number;
  podIP: string;
  nodeName: string;
  nominatedNodeName: string;
  readinessGates: string;
}

export enum KubernetesNodeConstants {
  // NodeUnreachablePodReason is the reason on a pod when its state cannot be confirmed as kubelet is unresponsive
  // on the node it is (was) running.
  NodeUnreachablePodReason = 'NodeLost'
}

/**
 * List of known status that could be returned from `createPodExpandedStatus`
 */
export enum KubernetesPodExpandedStatusTypes {
  RUNNING = 'Running',
  UNKNOWN = 'Unknown',
  TERMINATING = 'Terminating',
  INIT = 'Init',
  COMPLETED = 'Completed'
}

export class KubernetesPodExpandedStatusHelper {

  static updatePodWithExpandedStatus(pod: KubernetesPod): KubernetesPod {
    return {
      ...pod,
      expandedStatus: this.createPodExpandedStatus(pod)
    };
  }

  /**
   * This function is similar to kubectl printPod from
   * https://github.com/kubernetes/kubernetes/blob/master/pkg/printers/internalversion/printers.go#L659
   * No optimisation was done to ensure ease of update later on
   */
  static createPodExpandedStatus(pod: KubernetesPod): KubernetesPodExpandedStatus {

    let restarts = 0;
    const totalContainers = pod.spec.containers ? pod.spec.containers.length : 0;
    let readyContainers = 0;

    let reason = pod.status.phase ? pod.status.phase.toString() : '';
    if (!!pod.status.reason) {
      reason = pod.status.reason;
    }

    let initializing = false;
    const initContainerStatuses = pod.status.initContainerStatuses || [];
    for (let i = 0; i < initContainerStatuses.length; i++) {
      const container = initContainerStatuses[i];
      restarts += container.restartCount;

      const state = container.state || {};

      if (!!state.terminated && state.terminated.exitCode === 0) {

      } else if (!!state.terminated) {
        if (state.terminated.reason.length === 0) {
          if (state.terminated.signal !== 0) {
            reason = `${KubernetesPodExpandedStatusTypes.INIT}:Signal:${state.terminated.signal}`;
          } else {
            reason = `${KubernetesPodExpandedStatusTypes.INIT}:ExitCode:${state.terminated.exitCode}`;
          }
        } else {
          reason = `${KubernetesPodExpandedStatusTypes.INIT}:${state.terminated.reason}`;
        }
        initializing = true;
      } else if (!!state.waiting && !!state.waiting.reason && state.waiting.reason !== 'PodInitializing') {
        reason = `${KubernetesPodExpandedStatusTypes.INIT}:${state.waiting.reason}`;
        initializing = true;
      } else {
        reason = `${KubernetesPodExpandedStatusTypes.INIT}:${i}/${pod.spec.initContainers.length}`;
        initializing = true;
      }
    }
    if (!initializing) {
      restarts = 0;
      let hasRunning = false;

      const containerStatuses = pod.status.containerStatuses || [];
      for (let i = containerStatuses.length - 1; i >= 0; i--) {
        const container = containerStatuses[i];
        const state = container.state || {};
        restarts += container.restartCount;
        if (!!state.waiting) {
          reason = state.waiting.reason;
        } else if (!!state.terminated) {
          reason = state.terminated.reason;
          if (!!state.terminated.signal && state.terminated.signal !== 0) {
            reason = `Signal:${state.terminated.signal}`;
          } else if (!!state.terminated.exitCode && state.terminated.exitCode !== 0) {
            reason = `ExitCode:${state.terminated.exitCode}`;
          }
        } else if (!!container.ready && !!state.running) {
          hasRunning = true;
          readyContainers++;
        }
      }

      // change pod status back to "Running" if there is at least one container still reporting as "Running" status
      if (reason === KubernetesPodExpandedStatusTypes.COMPLETED && hasRunning) {
        reason = KubernetesPodExpandedStatusTypes.RUNNING;
      }
    }

    if (!!pod.deletionTimestamp && pod.status.reason === KubernetesNodeConstants.NodeUnreachablePodReason) {
      reason = KubernetesPodExpandedStatusTypes.UNKNOWN;
    } else if (!!pod.deletionTimestamp) {
      reason = KubernetesPodExpandedStatusTypes.TERMINATING;
    }


    let nodeName = pod.spec.nodeName;
    let nominatedNodeName = pod.status.nominatedNodeName;
    let podIP = pod.status.podIP;
    if (pod.status.podIPs && pod.status.podIPs.length > 0) {
      podIP = pod.status.podIPs[0].ip;
    }

    if (!podIP) {
      podIP = '<none>';
    }
    if (!nodeName) {
      nodeName = '<none>';
    }
    if (!nominatedNodeName) {
      nominatedNodeName = '<none>';
    }

    let readinessGates = '<none>';
    if (pod.spec.readinessGates && pod.spec.readinessGates.length > 0) {
      let trueConditions = 0;
      pod.spec.readinessGates.forEach(readinessGate => {
        const conditionType = readinessGate.ConditionType;
        for (const condition of pod.status.conditions) {
          if (condition.type === conditionType) {
            if (condition.status === 'True') {
              trueConditions++;
            }
            break;
          }
        }
      });
      readinessGates = `${trueConditions}/${pod.spec.readinessGates.length}`;
    }

    const res: KubernetesPodExpandedStatus = {
      readyContainers,
      totalContainers,
      status: reason,
      restarts,
      podIP,
      nodeName,
      nominatedNodeName,
      readinessGates
    };

    return res;
  }
}
