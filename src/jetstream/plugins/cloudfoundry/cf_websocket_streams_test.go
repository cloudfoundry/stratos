package cloudfoundry

import (
	"testing"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

// The Doppler/Noaa connection carries the user's live CF OAuth bearer token, so
// it must honour the endpoint's SkipSSLValidation rather than hardcoding
// InsecureSkipVerify:true (which exposed the token to an on-path MITM).
func TestDopplerTLSConfigHonoursSkipSSLValidation(t *testing.T) {
	if c := dopplerTLSConfig(api.CNSIRecord{SkipSSLValidation: true}); !c.InsecureSkipVerify {
		t.Fatalf("expected InsecureSkipVerify=true when the endpoint sets SkipSSLValidation")
	}
	if c := dopplerTLSConfig(api.CNSIRecord{SkipSSLValidation: false}); c.InsecureSkipVerify {
		t.Fatalf("expected InsecureSkipVerify=false by default (regression: was hardcoded true)")
	}
}

func TestDopplerTLSConfigLoadsCACert(t *testing.T) {
	if c := dopplerTLSConfig(api.CNSIRecord{}); c.RootCAs != nil {
		t.Fatalf("expected no custom RootCAs when CACert is empty")
	}
	withCA := dopplerTLSConfig(api.CNSIRecord{CACert: "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----"})
	if withCA.RootCAs == nil {
		t.Fatalf("expected RootCAs to be set when a CACert is provided")
	}
}
