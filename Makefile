all:
	@echo "see README.md"

.PHONY run:
run:
	python3 -m http.server 8000
