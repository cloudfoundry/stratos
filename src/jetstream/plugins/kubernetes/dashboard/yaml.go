package dashboard

import (
	"encoding/json"
	"strings"
)

func YAMLToJSONWithLabel(body interface{}) ([]byte, error) {
	body = convert(body)
	addLabel(body)
	b, err := json.Marshal(body)
	return b, err
}

func convert(i interface{}) interface{} {
	switch x := i.(type) {
	case map[interface{}]interface{}:
		m2 := map[string]interface{}{}
		for k, v := range x {
			m2[k.(string)] = convert(v)
		}
		return m2
	case []interface{}:
		for i, v := range x {
			x[i] = convert(v)
		}
	}
	return i
}

func addLabel(resource interface{}) {
	if labels, ok := getPath("metadata.labels", resource); ok {
		labels["stratos-role"] = "kubernetes-dashboard"
	} else {
		// Resource may not have labels
		if metadata, ok := getPath("metadata", resource); ok {
			// Got metadata
			labels := make(map[string]interface{})
			labels["stratos-role"] = "kubernetes-dashboard"
			metadata["labels"] = labels
		}
	}
}

func getPath(path string, resource interface{}) (map[string]interface{}, bool) {
	paths := strings.Split(path, ".")
	res := resource
	for _, key := range paths {
		if m, ok := res.(map[string]interface{}); ok {
			if value, ok := m[key]; ok {
				res = value
			} else {
				return make(map[string]interface{}), false
			}
		}
	}

	if m, ok := res.(map[string]interface{}); ok {
		return m, true
	}

	return make(map[string]interface{}), false
}
