package app

import (
	"db-gui/internal/git"
)

func (a *App) ResolveGitRepo(directory string) (git.RepoInfo, error) {
	return git.ResolveRepo(directory)
}

func (a *App) ListGitCommits(directory string, limit, offset int) ([]git.Commit, error) {
	return git.ListCommits(directory, limit, offset)
}

func (a *App) ListGitTableFiles(directory, commitHash string) ([]string, error) {
	return git.ListTableFiles(directory, commitHash)
}

func (a *App) ReadGitTableFile(directory, commitHash, relPath string) (string, error) {
	return git.ReadTableFile(directory, commitHash, relPath)
}
