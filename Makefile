SHELL := /bin/sh

.PHONY: setup dev-up dev-down build test lint typecheck bench

setup:
	npm run setup

dev-up:
	npm run dev-up

dev-down:
	npm run dev-down

build:
	npm run build

test:
	npm run test

lint:
	npm run lint

typecheck:
	npm run typecheck

bench:
	npm run bench
