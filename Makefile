MAKEFILE_PATH := $(abspath $(lastword $(MAKEFILE_LIST)))
SRC_DIR := $(dir $(MAKEFILE_PATH))

SRC_FILES += Code:$(SRC_DIR)Code.js
SRC_FILES += msgConsumers:$(SRC_DIR)msgConsumers.js
SRC_FILES += util:$(SRC_DIR)util.js
SRC_FILES += vendor-moment:$(SRC_DIR)vendor/moment.js
upload:
	gas upload -S "$(SRC_FILES)"
