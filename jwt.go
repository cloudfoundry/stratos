package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
)

type userTokenInfo struct {
	UserGUID    string   `json:"user_id"`
	UserName    string   `json:"user_name"`
	TokenExpiry int64    `json:"exp"`
	Scope       []string `json:"scope"`
}

func getUserTokenInfo(tok string) (u *userTokenInfo, err error) {
	logger.Println("getUserTokenInfo")
	accessToken := strings.TrimPrefix(tok, "bearer ")
	splits := strings.Split(accessToken, ".")

	if len(splits) < 3 {
		return u, errors.New("Token was poorly formed.")
	}

	decoded, err := base64.RawStdEncoding.DecodeString(splits[1])
	if err != nil {
		return u, errors.New("Unable to decode token string.")
	}

	if err = json.Unmarshal(decoded, &u); err != nil {
		return u, errors.New("Failed to unmarshall decoded token.")
	}

	return u, err
}
