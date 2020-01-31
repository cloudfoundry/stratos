package helm

import (
	"fmt"
	"strings"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// See: https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/
func podSelectorToQueryString(selector *metav1.LabelSelector) string {

	qs := "?labelSelector="
	ml := ""
	sep := ""

	// Match labels
	for k, v := range selector.MatchLabels {
		if len(ml) > 0 {
			sep = ","
		}
		ml = fmt.Sprintf("%s%s%s%%3D%s", ml, sep, k, v)
	}

	// Now add set based match expressions
	for _, v := range selector.MatchExpressions {
		if len(ml) > 0 {
			sep = ","
		}
		ml = fmt.Sprintf("%s%s%s+%s+%%28%s%%s29", ml, sep, v.Key, v.Operator, strings.Join(v.Values, "%%2C"))
	}

	if len(ml) > 0 {
		return fmt.Sprintf("%s%s", qs, ml)
	}

	return ""
}

// Check that the selectors maps contains everything in the find map
func labelsMatch(find, selectors map[string]string) bool {
	for k, v := range find {
		if sv, ok := selectors[k]; ok {
			if sv != v {
				return false
			}
		}
	}
	return true
}
