package main

import (
	"embed"
	"encoding/json"
	"flag"
	"log"
	"time"

	"pos-simulator-ecr-ws/internal/updater"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed wails.json
var wailsJSON []byte

type wailsConfig struct {
	Info struct {
		ProductVersion string `json:"productVersion"`
	} `json:"info"`
}

func main() {
	afterUpdatePID := flag.Int("after-update", 0, "Wait for previous process PID to exit before starting")
	flag.Parse()

	if *afterUpdatePID > 0 {
		_ = updater.WaitForProcessExit(*afterUpdatePID, 10*time.Second)
	}

	var wCfg wailsConfig
	if err := json.Unmarshal(wailsJSON, &wCfg); err != nil {
		log.Fatalf("failed to read embedded wails.json: %v", err)
	}

	version := wCfg.Info.ProductVersion
	if version == "" {
		version = "0.0.0-dev"
	}

	app, err := NewApp(version)
	if err != nil {
		log.Fatal(err)
	}

	err = wails.Run(&options.App{
		Title:  "POS Simulator ECR WebSocket",
		Width:  1024,
		Height: 768,

		MinWidth:  800,
		MinHeight: 680,

		AssetServer: &assetserver.Options{
			Assets: assets,
		},

		BackgroundColour: &options.RGBA{R: 17, G: 17, B: 27, A: 255},

		OnStartup:  app.startup,
		OnShutdown: app.shutdown,

		EnableDefaultContextMenu: false,

		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		log.Fatal(err)
	}
}
