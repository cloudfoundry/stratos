---
title: Developing the Stratos Console
sidebar_label: Stratos Development 
---

1. [Introduction](#introduction)
1. [Frontend Development](#frontend-development)
1. [Backend Development](#backend-development)

## Introduction

Stratos comprises of two main components:

- A front-end UI that runs in your web browser. This is written in [Typescript](https://www.typescriptlang.org/) and uses the [Angular](https://angular.io/) framework.
- A back-end that provides a web-based API to the front-end. This is written in Go.

Depending on what you are contributing, you will need to develop with the front-end, back-end or both.

## Building and running the Frontend and Backend Locally

For a quick-start to get Stratos built and running locally on a development system, follow the steps below.

You will need to have `go` and `nodejs` installed in your development environment.

```
git clone https://github.com/cloudfoundry/stratos.git
cd stratos
npm install
npm run build
npm run build-backend
./src/jetstream/jetstream
```

This will build both the frontend and backend and run the backend in a mode where it will also serve the static resources for the frontend.

You can open a web browser and navigate to (https://127.0.0.1:5443) and login with username `admin` and password `admin`.


