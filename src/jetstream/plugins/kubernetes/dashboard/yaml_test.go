package dashboard

import (
	"encoding/json"
	"testing"

	yaml "go.yaml.in/yaml/v4"
)

// The dashboard manifest is decoded into an interface{} and handed straight to
// YAMLToJSONWithLabel, so the decoder has to yield map[string]interface{} - both
// the metadata walk and json.Marshal reject a map[interface{}]interface{} tree.
func TestYAMLToJSONWithLabel(t *testing.T) {
	tests := []struct {
		name string
		doc  string
		want map[string]string
	}{
		{
			name: "existing labels are kept",
			doc: `
apiVersion: v1
kind: Namespace
metadata:
  name: kubernetes-dashboard
  labels:
    existing: keep
`,
			want: map[string]string{"existing": "keep", "stratos-role": "kubernetes-dashboard"},
		},
		{
			name: "labels are added when absent",
			doc: `
apiVersion: v1
kind: ServiceAccount
metadata:
  name: kubernetes-dashboard
`,
			want: map[string]string{"stratos-role": "kubernetes-dashboard"},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			var resource interface{}
			if err := yaml.Load([]byte(tc.doc), &resource); err != nil {
				t.Fatalf("Load: %v", err)
			}

			jsonDoc, err := YAMLToJSONWithLabel(resource)
			if err != nil {
				t.Fatalf("YAMLToJSONWithLabel: %v", err)
			}

			var got struct {
				Metadata struct {
					Labels map[string]string `json:"labels"`
				} `json:"metadata"`
			}
			if err := json.Unmarshal(jsonDoc, &got); err != nil {
				t.Fatalf("json.Unmarshal: %v", err)
			}

			if len(got.Metadata.Labels) != len(tc.want) {
				t.Fatalf("labels = %v, want %v", got.Metadata.Labels, tc.want)
			}
			for k, v := range tc.want {
				if got.Metadata.Labels[k] != v {
					t.Errorf("labels[%q] = %q, want %q", k, got.Metadata.Labels[k], v)
				}
			}
		})
	}
}
