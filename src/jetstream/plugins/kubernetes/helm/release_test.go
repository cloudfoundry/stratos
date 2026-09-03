package helm

import (
	"strings"
	"testing"

	. "github.com/smartystreets/goconvey/convey"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
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

func TestRestURL(t *testing.T) {
	Convey("restURL", t, func() {
		mapper := meta.NewDefaultRESTMapper(nil)
		mapper.Add(schema.GroupVersionKind{Group: "apps", Version: "v1", Kind: "Deployment"}, meta.RESTScopeNamespace)
		mapper.Add(schema.GroupVersionKind{Group: "", Version: "v1", Kind: "Service"}, meta.RESTScopeNamespace)
		mapper.Add(schema.GroupVersionKind{Group: "rbac.authorization.k8s.io", Version: "v1", Kind: "ClusterRole"}, meta.RESTScopeRoot)
		mapper.Add(schema.GroupVersionKind{Group: "networking.k8s.io", Version: "v1", Kind: "IngressClass"}, meta.RESTScopeRoot)
		mapper.Add(schema.GroupVersionKind{Group: "networking.k8s.io", Version: "v1", Kind: "Ingress"}, meta.RESTScopeNamespace)
		r := &HelmRelease{mapper: mapper}

		Convey("namespaced resources sit under the namespace, with no /status suffix", func() {
			So(r.restURL("ns", "Deployment", "apps/v1", "web"), ShouldEqual, "/apis/apps/v1/namespaces/ns/deployments/web")
			So(r.restURL("ns", "Service", "v1", "web"), ShouldEqual, "/api/v1/namespaces/ns/services/web")
		})

		Convey("cluster-scoped resources drop the namespace even when one is given", func() {
			So(r.restURL("ns", "ClusterRole", "rbac.authorization.k8s.io/v1", "admin"), ShouldEqual, "/apis/rbac.authorization.k8s.io/v1/clusterroles/admin")
			So(r.restURL("ns", "IngressClass", "networking.k8s.io/v1", "traefik"), ShouldEqual, "/apis/networking.k8s.io/v1/ingressclasses/traefik")
		})

		Convey("the plural comes from discovery, not string surgery", func() {
			So(r.restURL("ns", "Ingress", "networking.k8s.io/v1", "web"), ShouldEqual, "/apis/networking.k8s.io/v1/namespaces/ns/ingresses/web")
		})

		Convey("a kind discovery does not know falls back to the heuristic, still without /status", func() {
			So(r.restURL("ns", "IngressRoute", "traefik.io/v1alpha1", "dash"), ShouldEqual, "/apis/traefik.io/v1alpha1/namespaces/ns/ingressroutes/dash")
		})

		Convey("with no mapper at all the heuristic pluralises s/x/ch/sh endings with es", func() {
			bare := &HelmRelease{}
			So(bare.restURL("ns", "Ingress", "networking.k8s.io/v1", "web"), ShouldEqual, "/apis/networking.k8s.io/v1/namespaces/ns/ingresses/web")
			So(bare.restURL("ns", "NetworkPolicy", "networking.k8s.io/v1", "deny"), ShouldEqual, "/apis/networking.k8s.io/v1/namespaces/ns/networkpolicies/deny")
			So(bare.restURL("ns", "ConfigMap", "v1", "cfg"), ShouldEqual, "/api/v1/namespaces/ns/configmaps/cfg")
		})

		Convey("isClusterScoped follows the mapper and defaults to namespaced", func() {
			So(r.isClusterScoped("ClusterRole", "rbac.authorization.k8s.io/v1"), ShouldBeTrue)
			So(r.isClusterScoped("Deployment", "apps/v1"), ShouldBeFalse)
			So(r.isClusterScoped("IngressRoute", "traefik.io/v1alpha1"), ShouldBeFalse)
		})
	})
}
