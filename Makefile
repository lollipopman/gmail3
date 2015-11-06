.PHONY: upload jshint test
MAKEFILE_PATH := $(abspath $(lastword $(MAKEFILE_LIST)))
SRC_DIR := $(dir $(MAKEFILE_PATH))

SRC_FILES += main:$(SRC_DIR)main.js
SRC_FILES += gmail3:$(SRC_DIR)gmail3.js
SRC_FILES += gmail3MsgConsumers:$(SRC_DIR)gmail3MsgConsumers.js
SRC_FILES += vendor-moment:$(SRC_DIR)vendor/moment.js
SRC_FILES += vendor-lodash:$(SRC_DIR)vendor/lodash.js
SRC_FILES += vendor-objDB:$(SRC_DIR)vendor/objDB.js

upload: jshint
	gas upload -S "$(SRC_FILES)"

jshint:
	jshint *.js

test:
	mocha
