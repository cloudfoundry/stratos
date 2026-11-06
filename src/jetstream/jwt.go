package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"log/slog"
	"strings"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

func (p *portalProxy) GetUserTokenInfo(tok string) (u *api.JWTUserTokenInfo, err error) {
	slog.Debug("getUserTokenInfo")
	accessToken := strings.TrimPrefix(tok, "bearer ")
	splits := strings.Split(accessToken, ".")

	if len(splits) < 3 {
		return u, errors.New("token was poorly formed")
	}

	decoded, err := base64.RawStdEncoding.DecodeString(splits[1])
	if err != nil {
		return u, errors.New("unable to decode token string")
	}

	if err = json.Unmarshal(decoded, &u); err != nil {
		return u, errors.New("failed to unmarshall decoded token")
	}

	return u, err
}
