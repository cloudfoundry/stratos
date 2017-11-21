{{/* vim: set filetype=mustache: */}}
{{/*
Image pull secret
*/}}
{{- define "imagePullSecret" }}
{{- printf "{\"%s\":{\"username\": \"%s\",\"password\":\"%s\",\"email\":\"%s\",\"auth\": \"%s\"}}" .Values.dockerRegistry .Values.dockerRegistryUserName .Values.dockerRegistryPassword .Values.dockerRegistryEmail (printf "%s:%s" .Values.dockerRegistryUserName .Values.dockerRegistryPassword | b64enc) | b64enc }}
{{- end }}