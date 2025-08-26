package main

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path"
	"runtime"
	"strings"
	"syscall"
	"time"

	"github.com/getlantern/systray"
)

// Keep dist mirrored under ./_embed/dist via go:generate.
//go:generate go run ./tools/syncdist.go

// Embed the mirrored files and the tray icon.
//
//go:embed _embed/dist/** res/app.ico
var embeddedFS embed.FS

// global app state (kept simple)
var (
	srv    *http.Server
	ln     net.Listener
	appURL string // like http://127.0.0.1:43183/
)

// Serve index.html or <route>.html for extensionless paths.
func makeHandler() (http.Handler, error) {
	sub, err := fs.Sub(embeddedFS, "_embed/dist")
	if err != nil {
		return nil, err
	}
	static := http.FileServer(http.FS(sub))

	serveHTML := func(w http.ResponseWriter, filename string) bool {
		b, err := fs.ReadFile(sub, filename)
		if err != nil {
			return false
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(b)
		return true
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Local safety headers (optional)
		w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
		w.Header().Set("Cross-Origin-Embedder-Policy", "require-corp")
		// Add cache headers if you want, or keep default.

		p := path.Clean(r.URL.Path)

		if p == "/" {
			if serveHTML(w, "index.html") {
				return
			}
			http.NotFound(w, r)
			return
		}

		// If no extension (e.g., /library), try adding ".html"
		if !strings.Contains(path.Base(p), ".") && !strings.HasSuffix(p, "/") {
			candidate := strings.TrimPrefix(p, "/") + ".html"
			if _, err := fs.Stat(sub, candidate); err == nil {
				serveHTML(w, candidate)
				return
			}
		}

		// Everything else (assets, .css, .js, .html files) via FileServer
		static.ServeHTTP(w, r)
	}), nil
}

func openBrowser(url string) {
	switch runtime.GOOS {
	case "windows":
		_ = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		_ = exec.Command("open", url).Start()
	default:
		_ = exec.Command("xdg-open", url).Start()
	}
}

func startServer() (string, error) {
	handler, err := makeHandler()
	if err != nil {
		return "", err
	}

	lnLocal, err := net.Listen("tcp", "127.0.0.1:0") // random free port
	if err != nil {
		return "", err
	}
	ln = lnLocal
	addr := ln.Addr().String()
	appURL = fmt.Sprintf("http://%s/", addr)

	srv = &http.Server{
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		if err := srv.Serve(ln); err != nil && err != http.ErrServerClosed {
			// On Windows GUI build, no console; consider writing to a file if you need logs.
			log.Printf("server error: %v", err)
		}
	}()

	return appURL, nil
}

func shutdownServer() {
	if srv == nil {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
	if ln != nil {
		_ = ln.Close()
	}
}

func onReady() {
	// Set tray icon and menu
	iconBytes, _ := embeddedFS.ReadFile("res/app.ico")
	if len(iconBytes) > 0 {
		systray.SetIcon(iconBytes)
	}
	systray.SetTitle("F1Scheduler")
	systray.SetTooltip("F1Scheduler (local)")

	// Menu items
	mOpen := systray.AddMenuItem("Genrar Horarios", "Open home page")
	mLibrary := systray.AddMenuItem("Consultar Libraría", "Open /library")
	systray.AddSeparator()
	mQuit := systray.AddMenuItem("Apagar", "Detiene la aplicación")

	// Handle clicks
	go func() {
		for {
			select {
			case <-mOpen.ClickedCh:
				openBrowser(appURL + "index.html")
			case <-mLibrary.ClickedCh:
				// works whether your route is /library or /library.html
				openBrowser(appURL + "library")
			case <-mQuit.ClickedCh:
				systray.Quit() // triggers onExit
				return
			}
		}
	}()
}

func onExit() {
	// Graceful shutdown
	shutdownServer()
}

func main() {
	// Start server first so tray menu has a URL to open
	if _, err := startServer(); err != nil {
		// if you want, write to a log file instead of printing
		log.Fatal(err)
	}

	// Open browser on first launch
	openBrowser(appURL + "index.html")
	// Handle OS signals as a backup (e.g., from Task Manager)
	go func() {
		c := make(chan os.Signal, 1)
		signal.Notify(c, os.Interrupt, syscall.SIGTERM)
		<-c
		systray.Quit()
	}()

	// Run tray loop (blocks until Quit)
	systray.Run(onReady, onExit)
}
