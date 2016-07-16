package main

import (
	"log"
	"net/http"

	"github.com/gorilla/context"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
)

func (p *portalProxy) sessionMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		log.Println("sessionMiddleware")
		if userID, ok := p.getSessionValue(c, "user_id"); ok {
			c.Set("user_id", userID)
			return h(c)
		}

		return c.NoContent(http.StatusUnauthorized)
	}
}

func sessionCleanupMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		log.Println("sessionCleanupMiddleware")
		err := h(c)
		req := c.Request().(*standard.Request).Request
		context.Clear(req)

		return err
	}
}

func errorLoggingMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		log.Println("errorLoggingMiddleware")
		err := h(c)
		if shadowError, ok := err.(errHTTPShadow); ok {
			log.Println(shadowError.LogMessage)
			return shadowError.HTTPError
		}

		return err
	}
}
