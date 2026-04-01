# ===== Config =====
VARIANT ?= default
VARIANT := $(shell echo $(VARIANT) | tr A-Z a-z)
APP_ENV ?= prod
ENTRY = app.py

# ==== App Info =====
APP_NAME := $(shell python -c "import build.$(VARIANT) as b; print(b.APP_NAME.replace(' ', '_'))")
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

# ===== Console Mode =====
ifeq ($(APP_ENV),dev)
WINDOWS_CONSOLE_MODE = --windows-console-mode=force
else
WINDOWS_CONSOLE_MODE = --windows-console-mode=disable
endif

# ===== Nuitka =====
NUITKA = python -m nuitka
NUITKA_FLAGS = --standalone --onefile \
               --enable-plugin=pyside6 \
               $(WINDOWS_CONSOLE_MODE) \
               --include-module=websockets \
               --include-module=websockets.asyncio \
               --include-module=websockets.asyncio.client \
               --include-module=build.build_info \
			   --include-package=build \
			   --assume-yes-for-downloads

# ===== Build Info =====
BUILD_INFO = build/build_info.py

$(BUILD_INFO):
	@echo "APP_VARIANT = '$(VARIANT)'" > $(BUILD_INFO)
	@echo "APP_VERSION = '$(APP_VERSION)'" >> $(BUILD_INFO)

# ===== Targets =====
.PHONY: all build clean rebuild help

all: build

build: $(BUILD_INFO)
	@echo "==> Building $(APP_NAME) v$(APP_VERSION) [variant=$(VARIANT), env=$(APP_ENV)]"
	$(NUITKA) $(NUITKA_FLAGS) \
	--output-dir=$(OUT_DIR) \
	--output-filename=$(APP_NAME)_v$(APP_VERSION)$(VARIANT_SUFFIX).exe \
	$(ENTRY)

clean:
	rm -rf dist *.build *.dist *.spec *.onefile-build *.exe
	rm -f build/build_info.py
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

rebuild: clean build

# ===== Help =====
help:
	@echo ""
	@echo "Build commands:"
	@echo "  make build                     Build with default settings"
	@echo ""
	@echo "Options:"
	@echo "  VARIANT=<name>                 Build variant (default: default)"
	@echo "  APP_ENV=dev|prod               Build mode (default: prod)"
	@echo ""
	@echo "Examples:"
	@echo "  make build                     # default variant, production mode"
	@echo "  make build VARIANT=bri         # bri variant, production mode"
	@echo "  make build APP_ENV=dev         # default variant, dev mode (console enabled)"
	@echo "  make build VARIANT=bri APP_ENV=dev"
	@echo ""