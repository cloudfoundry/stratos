{{/* vim: set filetype=mustache: */}}
{{/*
Image pull secret
*/}}
{{- define "imagePullSecret" }}
{{- printf "{\"%s\":{\"username\": \"%s\",\"password\":\"%s\",\"email\":\"%s\",\"auth\": \"%s\"}}" .Values.kube.registry.hostname .Values.kube.registry.username .Values.kube.registry.password .Values.kube.registry.email (printf "%s:%s" .Values.kube.registry.username .Values.kube.registry.password | b64enc) | b64enc }}
{{- end }}

{{/*
Determine external IP:
This will do the following:
1. Check for Legacy SCF Config format
2. Check for Console specific External IP
3. Check for New SCf Config format
*/}}
{{- define "service.externalIPs" -}}
{{- if .Values.kube.external_ip -}}
{{- printf "\n - %s" .Values.kube.external_ip | indent 3 -}}
{{- else if .Values.console.externalIP -}}
{{- printf "\n - %s" .Values.console.externalIP | indent 3 -}}
{{- else if .Values.kube.external_ips -}}
{{- range .Values.kube.external_ips -}}
{{ printf "\n- %s" . | indent 4 -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Get SCf UAA Endpoint
*/}}
{{- define "scfUaaEndpoint" -}}
{{- if and .Values.env.DOMAIN (not .Values.env.UAA_HOST) -}}
{{- printf "https://scf.uaa.%s:%v" .Values.env.DOMAIN .Values.env.UAA_PORT -}}
{{- else if .Values.env.UAA_HOST -}}
{{- printf "https://scf.%s:%v" .Values.env.UAA_HOST .Values.env.UAA_PORT -}}
{{- end -}}
{{- end -}}