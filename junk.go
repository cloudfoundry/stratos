package main

import (
	"io/ioutil"
	"log"
	"net/http"
)

func logHTTPError(r *http.Response, err error) {
	b := []byte("No request body")
	status := 0
	if r != nil {
		defer r.Body.Close()
		if bb, err := ioutil.ReadAll(r.Body); err == nil {
			b = bb
		}
		status = r.StatusCode
	}
	log.Printf("Error: %v\nStatus: %d\nResponse: %s", err, status, b)
}
