{{/* vim: set filetype=mustache: */}}
{{/*
Image pull secret
*/}}
{{- define "imagePullSecret" }}
{{- printf "{\"%s\":{\"username\": \"%s\",\"password\":\"%s\",\"email\":\"%s\",\"auth\": \"%s\"}}" .Values.kube.registry.hostname .Values.kube.registry.username .Values.kube.registry.password .Values.kube.registry.email (printf "%s:%s" .Values.kube.registry.username .Values.kube.registry.password | b64enc) | b64enc }}
{{- end }}


{{/*
Determine external IPs:
This will do the following:
1. Check for Legacy SCF Config format
2. Check for Console specific External IP
3. Check for New SCF Config format
4. Check for new Console External IPS
*/}}
{{- define "service.externalIPs" -}}
{{- if .Values.kube.external_ip }}
  externalIPs:
{{- printf "\n - %s" .Values.kube.external_ip | indent 3 -}}
{{- printf "\n" -}}
{{- else if .Values.console.externalIP }}
  externalIPs:
{{- printf "\n - %s" .Values.console.externalIP | indent 3 -}}
{{- printf "\n" -}}
{{- else if .Values.kube.external_ips }}
  externalIPs:
{{- range .Values.kube.external_ips -}}
{{- printf "\n- %s" . | indent 4 -}}
{{- end -}}
{{- printf "\n" -}}
{{- else if .Values.console.service -}}
{{- if .Values.console.service.externalIPs }}
  externalIPs:
{{- range .Values.console.service.externalIPs -}}
{{ printf "\n- %s" . | indent 4 }}
{{- end -}}
{{- printf "\n" -}}
{{- end -}}
{{- end -}}
{{ end }}

{{/*
Get SCF UAA Endpoint
*/}}
{{- define "scfUaaEndpoint" -}}

{{- $uaa_zone := default "scf" .Values.env.UAA_ZONE -}}
{{- if and .Values.env.DOMAIN (not .Values.env.UAA_HOST) -}}
{{- if .Values.env.UAA_ZONE -}}
{{- printf "https://%s.uaa.%s:%v" .Values.env.UAA_ZONE .Values.env.DOMAIN .Values.env.UAA_PORT -}}
{{- else -}}
{{- printf "https://uaa.%s:%v" .Values.env.DOMAIN .Values.env.UAA_PORT -}}
{{- end -}}
{{- else if .Values.env.UAA_HOST -}}
{{- if .Values.env.UAA_ZONE -}}
{{- printf "https://%s.%s:%v" .Values.env.UAA_ZONE .Values.env.UAA_HOST .Values.env.UAA_PORT -}}
{{- else -}}
{{- printf "https://%s:%v" .Values.env.UAA_HOST .Values.env.UAA_PORT -}}
{{- end -}}
{{- end -}}
{{- end -}}


{{/*
Service type:
*/}}
{{- define "service.serviceType" -}}
{{- if or .Values.useLb .Values.services.loadbalanced -}}
LoadBalancer
{{- else -}}
{{- if .Values.console.service -}}
{{- default "ClusterIP" .Values.console.service.type -}}
{{- else -}}
ClusterIP
{{- end -}}
{{- end -}}
{{- end -}}


{{/*
Service port:
*/}}
{{- define "service.servicePort" -}}
{{- if and .Values.kube.external_ips .Values.kube.external_console_https_port -}}
{{ printf "%v" .Values.kube.external_console_https_port }}
{{- else -}}
{{- if .Values.console.service -}}
{{ default 443 .Values.console.service.servicePort}}
{{- else -}}
443
{{- end -}}
{{- end -}}
{{- end -}}


{{/*
Expand the name of the chart.
*/}}
{{- define "console.certName" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}


{{/*
Generate self-signed certificate
*/}}
{{- define "console.generateCertificate" -}}
{{- $altNames := list ( printf "%s.%s" (include "console.certName" .) .Release.Namespace ) ( printf "%s.%s.svc" (include "console.certName" .) .Release.Namespace ) -}}
{{- $ca := genCA "stratos-ca" 365 -}}
{{- $cert := genSignedCert ( include "console.certName" . ) nil $altNames 365 $ca -}}
tls.crt: {{ $cert.Cert | b64enc }}
tls.key: {{ $cert.Key | b64enc }}
{{- end -}}

{{/*
Generate self-signed certificate for ingress if needed
*/}}
{{- define "console.generateIngressCertificate" -}}
{{- $altNames := list (printf "%s" .Values.console.service.ingress.host) (printf "%s.%s" (include "console.certName" .) .Release.Namespace ) ( printf "%s.%s.svc" (include "console.certName" .) .Release.Namespace ) -}}
{{- $ca := genCA "stratos-ca" 365 -}}
{{- $cert := genSignedCert ( include "console.certName" . ) nil $altNames 365 $ca -}}
{{- if .Values.console.service.ingress.tls.crt }}
  tls.crt: {{ .Values.console.service.ingress.tls.crt | b64enc | quote }}
{{- else }}
  tls.crt: {{ $cert.Cert | b64enc | quote }}
{{- end -}}
{{- if .Values.console.service.ingress.tls.key }}
  tls.key: {{ .Values.console.service.ingress.tls.key | b64enc | quote }}
{{- else }}
  tls.key: {{ $cert.Key | b64enc | quote }}
{{- end -}}
{{- end -}}

{{/*
Ingress Host from .Values.console.service
*/}}
{{- define "ingress.host.value" -}}
{{- if .Values.console.service -}}
{{- if .Values.console.service.ingress -}}
{{- if .Values.console.service.ingress.host -}}
{{ .Values.console.service.ingress.host }}
{{- end -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Ingress Host:
*/}}
{{- define "ingress.host" -}}
{{ $host := (include "ingress.host.value" .) }}
{{- if $host -}}
{{ $host | quote }}
{{- else if .Values.env.DOMAIN -}}
{{ print "console." .Values.env.DOMAIN }}
{{- else -}}
{{ required "Host name is required" $host | quote }}
{{- end -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "fullname" -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
