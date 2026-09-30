.DEFAULT_GOAL := help

.PHONY: help install dev build preview test test-watch typecheck format format-check check-site check clean

help: ## 顯示常用指令
	@printf '暖暖森林開發指令\n\n'
	@awk 'BEGIN { FS = ":.*## " } /^[a-zA-Z0-9_-]+:.*## / { printf "  make %-14s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@printf '\n指定連接埠：make dev PORT=5176 / make preview PORT=4176\n'

install: ## 依照 bun.lock 安裝依賴
	bun install --frozen-lockfile

dev: PORT ?= 5173
dev: ## 啟動支援熱更新的開發伺服器
	PORT="$(PORT)" bun run dev

build: ## 型別檢查並產生正式版本 dist/
	bun run build

preview: PORT ?= 4173
preview: build ## 建置後預覽正式版本
	PORT="$(PORT)" bun run preview

test: ## 執行所有測試
	bun test

test-watch: ## 監看檔案變更並重新執行測試
	bun test --watch

typecheck: ## 執行 TypeScript 型別檢查
	bun run typecheck

format: ## 格式化原始碼與文件
	bun run format

format-check: ## 檢查格式，不修改檔案
	bun run format:check

check-site: build ## 建置並驗證 SEO、圖示與靜態資源
	bun run check:site

check: format-check test check-site ## 執行格式、測試、型別、建置與網站檢查

clean: ## 移除產生的 dist/ 目錄
	rm -rf dist
