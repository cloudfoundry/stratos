package helm

import (
	"strings"
	"testing"

	. "github.com/smartystreets/goconvey/convey"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// podSelectorToQueryString now takes *metav1.LabelSelector directly.
// The older KubeDeploymentResource wrapper referenced by the previous
// version of this test was removed when the helper was simplified.

func TestPodSelector(t *testing.T) {
	Convey("podSelectorToQueryString", t, func() {
		Convey("empty selector produces empty query string", func() {
			selector := &metav1.LabelSelector{
				MatchLabels: map[string]string{},
			}
			So(podSelectorToQueryString(selector), ShouldEqual, "")
		})

		Convey("single match label is encoded with URL-escaped equals", func() {
			selector := &metav1.LabelSelector{
				MatchLabels: map[string]string{"environment": "dev"},
			}
			So(podSelectorToQueryString(selector), ShouldEqual, "?labelSelector=environment%3Ddev")
		})

		Convey("multiple match labels are comma-separated", func() {
			selector := &metav1.LabelSelector{
				MatchLabels: map[string]string{"environment": "dev", "app": "api"},
			}
			// Map iteration is non-deterministic; accept either order.
			qs := podSelectorToQueryString(selector)
			So(qs, ShouldStartWith, "?labelSelector=")
			So(strings.Contains(qs, "environment%3Ddev"), ShouldBeTrue)
			So(strings.Contains(qs, "app%3Dapi"), ShouldBeTrue)
			So(strings.Contains(qs, ","), ShouldBeTrue)
		})
	})
}
