---
title: Developing the Stratos Console
sidebar_label: Getting Started
---

## Introduction

Stratos comprises of two main components:

- A front-end UI that runs in your web browser. This is written in [Typescript](https://www.typescriptlang.org/) and uses the [Angular](https://angular.io/) framework.
- A back-end that provides a web-based API to the front-end. This is written in [Go](https://golang.org/).

Depending on what you are contributing, you will need to develop with the front-end, back-end or both.

## Build & Run Locally

For a quick-start to get Stratos front and back ends built and running locally on a development system, follow the steps below.

You will need Node.js, Bun, Go, Git and Make; the [Required Runtimes](../developer-environment.md#required-runtimes) table lists the versions.

```
git clone https://github.com/cloudfoundry/stratos.git
cd stratos
make install
make dev backend     # terminal 1: backend on https://localhost:5443
make dev frontend    # terminal 2: frontend on https://localhost:5440
```

Before the first `make dev backend`, create `src/jetstream/config.properties` with an encryption key and a login method; the contributor guide's [First-Time Setup](../contributing_guide.md#first-time-setup) gives the exact lines, including a local `admin` user.

Then open https://localhost:5440 in a web browser.

> To develop the frontend we recommend reading through the [frontend](./frontend.md) doc. This includes a faster way to run Stratos and see your changes.

> Additional back end docs are available [here](./backend.md) before making any changes to the code.
