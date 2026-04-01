# ===== Config =====
VARIANT ?= default
VARIANT := $(shell echo $(VARIANT) | tr A-Z a-z)
ENTRY = app.py

# Normalize name
APP_NAME := $(shell python -c "import build.$(VARIANT) as b; print(b.APP_NAME.replace(' ', '_'))")

# ===== Version from Git Tag =====
APP_VERSION := $(shell git describe --tags --abbrev=0 2>/dev/null | sed 's/^v//')

ifeq ($(APP_VERSION),)
APP_VERSION := dev
endif

# ===== Variant suffix =====
ifeq ($(VARIANT),default)
VARIANT_SUFFIX :=
else
VARIANT_SUFFIX := -$(VARIANT)
endif

# ===== Output =====
OUT_DIR = dist
OUT_EXE = $(OUT_DIR)/$(APP_NAME)_v$(APP_VERSION)$(VARIANT_SUFFIX).exe

# ===== Nuitka =====
NUITKA = python -m nuitka
NUITKA_FLAGS = --standalone --onefile \
               --enable-plugin=pyqt5 \
               --windows-console-mode=disable \
               --include-module=websockets \
               --include-module=websockets.asyncio \
               --include-module=websockets.asyncio.client

# ===== Build =====
.PHONY: all build build-default build-bri clean rebuild

all: build

build:
	APP_VARIANT=$(VARIANT) APP_VERSION=$(APP_VERSION) \
	$(NUITKA) $(NUITKA_FLAGS) \
	--output-dir=$(OUT_DIR) \
	--output-filename=$(APP_NAME)_v$(APP_VERSION)$(VARIANT_SUFFIX).exe \
	$(ENTRY)

build-default:
	$(MAKE) build VARIANT=default

build-bri:
	$(MAKE) build VARIANT=bri

clean:
	rm -rf dist *.build *.dist *.spec *.onefile-build *.exe
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

rebuild: clean all