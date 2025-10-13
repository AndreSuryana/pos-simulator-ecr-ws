# Application name
APP_NAME = POS_Simulator
ENTRY = app.py

# Nuitka options
NUITKA = python -m nuitka
NUITKA_FLAGS = --standalone --onefile --enable-plugin=pyqt5 --windows-console-mode=disable \
			   --include-module=websockets \
			   --include-module=websockets.asyncio \
			   --include-module=websockets.asyncio.client \

# Output dirs
OUT_DIR = dist
OUT_EXE = $(OUT_DIR)/$(APP_NAME).exe

# Default target
all: build

# Build target
build: $(OUT_EXE)

# Rule: how to make the exe
$(OUT_EXE): $(ENTRY)
	$(NUITKA) $(NUITKA_FLAGS) --output-dir=$(OUT_DIR) --output-filename=$(APP_NAME).exe $(ENTRY)

# Run only builds if exe missing
run: $(OUT_EXE)
	./$(OUT_EXE)

clean:
	rm -rf build $(OUT_DIR) *.build *.dist *.spec *.onefile-build $(APP_NAME).exe $(APP_NAME).bin
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

rebuild: clean all