package main

import (
	"strings"
	"unicode"
)

// ArrayContainsString checks the string array to see if it contains the specifed value
func ArrayContainsString(a []string, x string) bool {
	for _, n := range a {
		if x == n {
			return true
		}
	}
	return false
}

// RemoveSpaces removes all whitespace from the supplied string
func RemoveSpaces(str string) string {
	return strings.Map(func(r rune) rune {
		if unicode.IsSpace(r) {
			return -1
		}
		return r
	}, str)
}
