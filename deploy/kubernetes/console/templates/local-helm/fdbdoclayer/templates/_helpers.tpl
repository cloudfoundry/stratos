{{/* vim: set filetype=mustache: */}}


{{/*
Expand the name of the chart.
*/}}
{{- define "name" -}}
{{- $v := $.Files.Get "fdbvalues.yaml" | fromYaml }}
{{- default .Chart.Name $v.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "fullname" -}}
{{- $v := $.Files.Get "fdbvalues.yaml" | fromYaml }}
{{- $name := default .Chart.Name $v.nameOverride -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name for the document layer.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "doclayer.fullname" -}}
{{- $v := $.Files.Get "fdbvalues.yaml" | fromYaml }}
{{- $name := default .Chart.Name $v.nameOverride -}}
{{- printf "%s-%s-%s" .Release.Name $name "fdbdoclayer" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Render image reference
*/}}
{{- define "fdb.image" -}}
{{ .registry }}/{{ .repository }}:{{ .tag }}
{{- end -}}
