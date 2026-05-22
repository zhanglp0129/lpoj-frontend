DIR = $(shell pwd)
APP = $(shell basename $(DIR))

empty:
	@echo

# 构建
build:
	docker build -t $(APP):latest .
