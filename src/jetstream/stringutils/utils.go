package stringutils

import (
	"net/url"
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

// CompareURL compares two URLs, taking into account default HTTP/HTTPS ports and ignoring query string. Allows `b` to contain a wildcard `*`
// to match any path of `a`s
func CompareURL(a, b string) bool {

	ua, err := url.Parse(a)
	if err != nil {
		return false
	}

	ub, err := url.Parse(b)
	if err != nil {
		return false
	}

	aPort := getPort(ua)
	bPort := getPort(ub)
	return ua.Scheme == ub.Scheme && ua.Hostname() == ub.Hostname() && aPort == bPort && (ua.Path == ub.Path || ub.Path == "/*")
}

func getPort(u *url.URL) string {
	port := u.Port()
	if len(port) == 0 {
		switch u.Scheme {
		case "http":
			port = "80"
		case "https":
			port = "443"
		default:
			port = ""
		}
	}

	return port
}
