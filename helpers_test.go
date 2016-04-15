package main

import "encoding/json"

func jsonMust(i interface{}) string {
	b, err := json.Marshal(i)
	if err != nil {
		panic(err)
	}
	return string(b)
}
