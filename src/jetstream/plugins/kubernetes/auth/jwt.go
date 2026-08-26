package auth

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
)

// jwtClaims decodes the claim set of a JWT without verifying its signature.
//
// Both callers read a single claim from a token the platform has just issued to
// us over TLS, so there is nothing here to verify against — the previous
// implementation (SermoDigital/jose) did not verify either. Do not use this to
// make a trust decision about a token from an untrusted source.
func jwtClaims(token []byte) (map[string]interface{}, error) {
	parts := strings.Split(string(token), ".")
	if len(parts) != 3 {
		return nil, errors.New("malformed JWT: expected three dot-separated segments")
	}

	// The payload is base64url-encoded. JWTs are unpadded, but pad defensively
	// so a padded token decodes rather than erroring.
	segment := parts[1]
	if remainder := len(segment) % 4; remainder != 0 {
		segment += strings.Repeat("=", 4-remainder)
	}
	payload, err := base64.URLEncoding.DecodeString(segment)
	if err != nil {
		return nil, err
	}

	claims := map[string]interface{}{}
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, err
	}
	return claims, nil
}
