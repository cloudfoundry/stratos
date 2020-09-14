# Customizations for the Helm Chart

# Extra env vars for the Jetstream Pod in deployment.yaml
{{- define "stratosJetstreamEnv" }}
- name: ANALYSIS_SERVICES_API
  value: "http://{{ .Release.Name }}-analyzers:8090"
- name: STRATOS_KUBERNETES_NAMESPACE
  value: "{{ .Release.Namespace }}"
- name: STRATOS_KUBERNETES_TERMINAL_IMAGE
  value: "{{.Values.kube.registry.hostname}}/{{.Values.kube.organization}}/stratos-kube-terminal:{{.Values.consoleVersion}}"
- name: STRATOS_KUBERNETES_DASHBOARD_IMAGE
  value: "{{.Values.console.kubeDashboardImage}}"
{{- end }}