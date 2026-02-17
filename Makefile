all:
	@echo "Available commands:"
	@echo "  make run              : Start local web server"
	@echo "  make bust             : Bust browser cache (bump ?v= on CSS/JS)"
	@echo "  make gallery          : Optimize images (keeps originals)"
	@echo "  make gallery-clean    : Optimize images AND DELETE originals"
	@echo "  make posts            : Regenerate posts/posts.json from frontmatter"

.PHONY: run
run:
	python3 -m http.server 8000

.PHONY: bust
bust:
	@V=$$(date +%s); \
	sed -i '' -E "s/\.(css|js)\?v=[0-9]+/.\1?v=$$V/g" index.html; \
	echo "Cache busted with v=$$V"

.PHONY: gallery
gallery:
	./bin/generate-gallery

.PHONY: gallery-clean
gallery-clean:
	./bin/generate-gallery --delete

.PHONY: posts
posts:
	./bin/generate-posts
