#!/bin/sh
glide install
go build -ldflags="-X=main.appVersion=${APP_VERSION}" ../portal-proxy
