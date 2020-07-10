# Customizations for the Helm Chart

# Extra env vars for the Jetstream Pod in deployment.yaml
{{- define "stratosJetstreamEnv" }}
- name: MONOCULAR_CRT_PATH
  value: "/etc/monocular-certs/tls.crt"
- name: MONOCULAR_KEY_PATH
  value: "/etc/monocular-certs/tls.key"
- name: MONOCULAR_CA_CRT_PATH
  value: "/etc/monocular-certs/ca.crt"
- name: FDB_URL
  value: "mongodb://{{ .Release.Name }}-fdbdoclayer:27016"
- name: SYNC_SERVER_URL
  value: "http://{{ .Release.Name }}-chartsync:8080"
- name: STRATOS_KUBERNETES_NAMESPACE
  value: "{{ .Release.Namespace }}"
- name: STRATOS_KUBERNETES_TERMINAL_IMAGE
  value: "{{.Values.kube.registry.hostname}}/{{.Values.kube.organization}}/stratos-kube-terminal:{{.Values.consoleVersion}}"
- name: STRATOS_KUBERNETES_DASHBOARD_IMAGE
  value: "{{.Values.console.kubeDashboardImage}}"
{{- end }}