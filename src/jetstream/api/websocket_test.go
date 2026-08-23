package api

import (
	"reflect"
	"testing"
)

func TestSetWebSocketAllowedOrigins(t *testing.T) {
	defer SetWebSocketAllowedOrigins(nil)

	cases := []struct {
		name string
		in   []string
		want []string
	}{
		{"empty", nil, []string{}},
		{"full origins reduce to hosts", []string{"https://console.example.com", "https://localhost:4200"}, []string{"console.example.com", "localhost:4200"}},
		{"wildcard passes through", []string{"*"}, []string{"*"}},
		{"blank entries dropped", []string{"", "https://a.example.com", ""}, []string{"a.example.com"}},
		{"bare host kept as-is", []string{"bare.host"}, []string{"bare.host"}},
	}
	for _, tc := range cases {
		SetWebSocketAllowedOrigins(tc.in)
		if !reflect.DeepEqual(wsOriginPatterns, tc.want) {
			t.Errorf("%s: SetWebSocketAllowedOrigins(%v) -> %v, want %v", tc.name, tc.in, wsOriginPatterns, tc.want)
		}
	}
}
