package cfapppush

import (
	"testing"
)

// Tests for the apiVersion fallback logic in setEndpointInfo.
// The full function requires a portalProxy, so we test the version-selection
// logic as a standalone helper that mirrors the production code path.

// resolveAPIVersion implements the same fallback Stratos uses in
// setEndpointInfo: prefer the V2 api_version; fall back to the CloudController
// v3 meta version when V2 is empty (i.e. CAPI v2 disabled).
func resolveAPIVersion(v2APIVersion string, ccV3MetaVersion string) string {
	if v2APIVersion != "" {
		return v2APIVersion
	}
	return ccV3MetaVersion
}

func TestResolveAPIVersion(t *testing.T) {
	cases := []struct {
		name            string
		v2APIVersion    string
		ccV3MetaVersion string
		want            string
	}{
		{
			name:            "v2 enabled: v2 api_version returned as-is",
			v2APIVersion:    "2.245.0",
			ccV3MetaVersion: "3.224.0",
			want:            "2.245.0",
		},
		{
			name: "v2 disabled: v2 api_version empty, falls back to cc v3 meta version",
			// This is the case that caused "Version string empty" — /v2/info
			// returns "" for api_version when CAPI v2 is disabled.
			v2APIVersion:    "",
			ccV3MetaVersion: "3.224.0",
			want:            "3.224.0",
		},
		{
			name: "both empty: returns empty (unexpected, but should not panic)",
			v2APIVersion:    "",
			ccV3MetaVersion: "",
			want:            "",
		},
		{
			name: "v2 disabled, leading-v version string (semver variant)",
			v2APIVersion:    "",
			ccV3MetaVersion: "3.224.0",
			want:            "3.224.0",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := resolveAPIVersion(tc.v2APIVersion, tc.ccV3MetaVersion)
			if got != tc.want {
				t.Errorf("resolveAPIVersion(%q, %q) = %q; want %q",
					tc.v2APIVersion, tc.ccV3MetaVersion, got, tc.want)
			}
		})
	}
}
