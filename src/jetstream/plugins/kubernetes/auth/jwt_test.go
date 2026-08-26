package auth

import (
	"encoding/base64"
	"testing"
)

// segment builds a base64url JWT segment the way an issuer would (unpadded).
func segment(json string) string {
	return base64.RawURLEncoding.EncodeToString([]byte(json))
}

func TestJWTClaims(t *testing.T) {
	token := []byte("header." + segment(`{"email":"user@example.com","exp":1893456000}`) + ".signature")

	claims, err := jwtClaims(token)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got, ok := claims["email"].(string); !ok || got != "user@example.com" {
		t.Errorf("email claim = %v, want user@example.com", claims["email"])
	}
	if got, ok := claims["exp"].(float64); !ok || got != 1893456000 {
		t.Errorf("exp claim = %v, want 1893456000", claims["exp"])
	}
}

func TestJWTClaimsPadded(t *testing.T) {
	// Some issuers emit padded base64url; it must still decode.
	padded := base64.URLEncoding.EncodeToString([]byte(`{"email":"a@b.c"}`))
	claims, err := jwtClaims([]byte("header." + padded + ".signature"))
	if err != nil {
		t.Fatalf("unexpected error decoding padded segment: %v", err)
	}
	if claims["email"] != "a@b.c" {
		t.Errorf("email claim = %v, want a@b.c", claims["email"])
	}
}

func TestJWTClaimsRejectsMalformed(t *testing.T) {
	for name, token := range map[string]string{
		"two segments":    "header.payload",
		"empty":           "",
		"bad base64":      "header.!!!not-base64!!!.signature",
		"payload no json": "header." + segment(`not json`) + ".signature",
	} {
		if _, err := jwtClaims([]byte(token)); err == nil {
			t.Errorf("%s: expected an error, got nil", name)
		}
	}
}
