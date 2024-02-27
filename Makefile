all:
	@echo "see README.md"

.PHONY run:
run:
	bundle exec jekyll serve --livereload
