all:
	@echo "Available commands:"
	@echo "  make run              : Start local web server"
	@echo "  make gallery          : Optimize images (keeps originals)"
	@echo "  make gallery-clean    : Optimize images AND DELETE originals"

.PHONY: run
run:
	python3 -m http.server 8000

.PHONY: gallery
gallery:
	./bin/generate-gallery

.PHONY: gallery-clean
gallery-clean:
	./bin/generate-gallery --delete
