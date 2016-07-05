package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"log"
	"strings"
)

// {
//   "jti": "2eddd4a59e9d4bc0892f5326e2b532f9-r",
//   "sub": "88bceaa5-bdce-47b8-82f3-4afc14f266f9",
//   "scope": [
//     "openid",
//     "scim.read",
//     "cloud_controller.admin",
//     "uaa.user",
//     "cloud_controller.read",
//     "password.write",
//     "routing.router_groups.read",
//     "cloud_controller.write",
//     "doppler.firehose",
//     "scim.write"
//   ],
//   "iat": 1467741391,
//   "exp": 1470333391,
//   "cid": "cf",
//   "client_id": "cf",
//   "iss": "https://uaa.example.com/oauth/token",
//   "zid": "uaa",
//   "grant_type": "password",
//   "user_name": "admin",
//   "origin": "uaa",
//   "user_id": "88bceaa5-bdce-47b8-82f3-4afc14f266f9",
//   "rev_sig": "140e026b",
//   "aud": [
//     "cf",
//     "openid",
//     "scim",
//     "cloud_controller",
//     "uaa",
//     "password",
//     "routing.router_groups",
//     "doppler"
//   ]
// }

type userTokenInfo struct {
	UserGUID    string   `json:"user_id"`
	UserName    string   `json:"user_name"`
	TokenExpiry int64    `json:"exp"`
	Scope       []string `json:"scope"`
}

func getUserTokenInfo(tok string) (u *userTokenInfo, err error) {
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

	log.Println("==============================")
	log.Printf("token: %s\n", tok)
	log.Printf("userTokenInfo: %+v\n", u)
	log.Println("==============================")

	return u, err
}
