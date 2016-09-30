#!/bin/bash
go build -ldflags="-X=main.appVersion=${APP_VERSION}" ../portal-proxy
