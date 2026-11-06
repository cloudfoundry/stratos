/**
 * Kubernetes-specific metric types for Prometheus metrics
 * These types extend the base metric types to include Kubernetes-specific properties
 */

/**
 * Kubernetes metric labels from Prometheus
 * These properties come from Kubernetes container metrics
 */
export interface IKubernetesMetric {
  // Standard Prometheus metric properties
  __name__?: string;
  job?: string;
  instance?: string;

  // Kubernetes-specific properties
  pod?: string;
  namespace?: string;
  container?: string;
  node?: string;

  // CPU-specific properties
  cpu?: string;

  // Network-specific properties
  interface?: string;

  // Generic properties for various metric types
  name?: string;
  id?: string;

  // Allow for additional dynamic properties from Prometheus
  [key: string]: string | undefined;
}

/**
 * Extended ChartSeries metadata for Kubernetes metrics
 */
// Metadata can include all metric properties
export type IKubernetesChartMetadata = IKubernetesMetric;
