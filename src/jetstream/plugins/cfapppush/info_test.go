package cfapppush

import (
	"testing"
)

// Tests for the apiVersion selection logic in setEndpointInfo.
// The full function requires a portalProxy, so we test the version-selection
// logic as a standalone helper that mirrors the production code path.

// resolveAPIVersion implements the same logic Stratos uses in setEndpointInfo:
// always prefer the CC v3 meta version from the root `/` links; only fall back
// to the V2 api_version when the v3 version is unavailable (unexpected).
// This ensures the CF CLI v8 minimum-version checks (which expect v3 version
// strings like "3.168.0") always pass, whether the foundation serves v2 or not.
func resolveAPIVersion(ccV3MetaVersion string, v2APIVersion string) string {
	if ccV3MetaVersion != "" {
		return ccV3MetaVersion
	}
	return v2APIVersion
}

func TestResolveAPIVersion(t *testing.T) {
	cases := []struct {
		name            string
		ccV3MetaVersion string
		v2APIVersion    string
		want            string
	}{
		{
			name: "v2 enabled: always uses v3 version for CLI checks (not v2)",
			// Even when v2 is enabled and returns "2.289.0", the CLI v8 minimum-
			// version checks expect v3 strings. Using "2.289.0" causes the CNB
			// check ("2.289.0 < 3.168.0") to fail, then triggers a token refresh
			// that produces "refresh_token parameter not provided".
			ccV3MetaVersion: "3.224.0",
			v2APIVersion:    "2.289.0",
			want:            "3.224.0",
		},
		{
			name: "v2 disabled: v3 version used (no v2 api_version available)",
			ccV3MetaVersion: "3.224.0",
			v2APIVersion:    "",
			want:            "3.224.0",
		},
		{
			name: "v3 version missing (unexpected): falls back to v2 api_version",
			ccV3MetaVersion: "",
			v2APIVersion:    "2.289.0",
			want:            "2.289.0",
		},
		{
			name:            "both empty: returns empty (unexpected, but should not panic)",
			ccV3MetaVersion: "",
			v2APIVersion:    "",
			want:            "",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := resolveAPIVersion(tc.ccV3MetaVersion, tc.v2APIVersion)
			if got != tc.want {
				t.Errorf("resolveAPIVersion(%q, %q) = %q; want %q",
					tc.ccV3MetaVersion, tc.v2APIVersion, got, tc.want)
			}
		})
	}
}
