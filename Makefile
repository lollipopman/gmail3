.PHONY: upload jshint test
MAKEFILE_PATH := $(abspath $(lastword $(MAKEFILE_LIST)))
SRC_DIR := $(dir $(MAKEFILE_PATH))

SRC_FILES += Code:$(SRC_DIR)Code.js
SRC_FILES += msgConsumers:$(SRC_DIR)msgConsumers.js
SRC_FILES += util:$(SRC_DIR)util.js
SRC_FILES += vendor-moment:$(SRC_DIR)vendor/moment.js
SRC_FILES += vendor-lodash:$(SRC_DIR)vendor/lodash.js
SRC_FILES += vendor-objDB:$(SRC_DIR)vendor/objDB.js

upload: jshint
	gas upload -S "$(SRC_FILES)"

jshint:
	jshint *.js

test:
	mocha
