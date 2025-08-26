package main

import (
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
)

func main() {
	repoDist := filepath.Clean(filepath.Join("..", "dist"))
	embedDist := filepath.Clean(filepath.Join("_embed", "dist"))

	info, err := os.Stat(repoDist)
	if err != nil || !info.IsDir() {
		fail("dist folder not found at ../dist; build your statics first")
	}

	_ = os.RemoveAll(embedDist)
	if err := os.MkdirAll(embedDist, 0o755); err != nil {
		fail("mk _embed/dist: %v", err)
	}

	err = filepath.WalkDir(repoDist, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, _ := filepath.Rel(repoDist, path)
		dst := filepath.Join(embedDist, rel)

		if d.IsDir() {
			return os.MkdirAll(dst, 0o755)
		}
		return copyFile(path, dst)
	})
	if err != nil {
		fail("copy: %v", err)
	}
	fmt.Println("synced ../dist → ./_embed/dist")
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer func() { _ = out.Close() }()

	if _, err := io.Copy(out, in); err != nil {
		return err
	}
	return out.Sync()
}

func fail(f string, a ...any) {
	fmt.Fprintf(os.Stderr, "syncdist: "+f+"\n", a...)
	os.Exit(1)
}
