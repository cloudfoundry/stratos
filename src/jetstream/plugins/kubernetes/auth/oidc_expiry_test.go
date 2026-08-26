package auth

import (
	"testing"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/kubernetes/config"
)

// The expiry claim used to be asserted as a string and parsed as RFC 3339.
// RFC 7519 defines exp as a NumericDate, so a conformant token could never
// satisfy that and every OIDC connect failed on the expiry claim.
func TestGetOIDCConfigReadsNumericExpiry(t *testing.T) {
	const exp = 1893456000 // 2030-01-01T00:00:00Z

	var kubeUser config.KubeConfigUser
	kubeUser.Name = "oidc-user"
	kubeUser.User.AuthProvider.Name = "oidc"
	kubeUser.User.AuthProvider.Config = map[string]interface{}{
		"id-token": "header." + segment(`{"email":"user@example.com","exp":1893456000}`) + ".signature",
	}

	c := &OIDCKubeAuth{}
	got, err := c.GetOIDCConfig(&kubeUser)
	if err != nil {
		t.Fatalf("GetOIDCConfig: unexpected error: %v", err)
	}
	if want := time.Unix(exp, 0); !got.Expiry.Equal(want) {
		t.Errorf("Expiry = %v, want %v", got.Expiry, want)
	}
}
