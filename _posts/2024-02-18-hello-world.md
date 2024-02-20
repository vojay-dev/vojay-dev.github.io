---
layout: post
title: Hello world
description: Time for a new project...
date: 2024-02-18 20:00:00 +0300
image: '/images/blog/2024-02-18.jpg'
tags: [life, motivation, jekyll, tech]
---

# Introduction

I maintain a folder of bookmarks with interesting frameworks, tools and technologies in general, which I would like to try at some point. One of these is [Jekyll](https://jekyllrb.com/){:target="_blank"}, a static site generator which takes text written in a markup language like Markdown and transforms it into appealing websites.

I also planned to renew my personal website for a while already as well as adding a blog, to share thoughts, ideas and stories about my journey as a father, data engineer, software developer, passionate speaker, gym enthusiast and adventurer. It is not like we have a lack of content these days, but I just love to write and share my thoughts, so for me, this is a way to jot down thoughts to clear my mind; one could even consider it a form of therapy. Like my personal `/dev/null` - and if I can even help or inspire someone with my content, it would be a great side effect.

Therefore, hello world 👋!

# Creating a page with Jekyll

Let's start with some useful content right away. How did I create this page with [Jekyll](https://jekyllrb.com/){:target="_blank"}? I am using macOS and this is a short guide on how to get started.

## Install Ruby

To install Jekyll on macOS, you need a Ruby development environment. While macOS comes preinstalled with Ruby, it is always a good practice to set up an environment, in which you have a nother tool to manage multiple versions, just like [pyenv](https://github.com/pyenv/pyenv){:target="_blank"} for Python or [jenv](https://github.com/jenv/jenv){:target="_blank"} for Java. The equivalent for Ruby which I recommend is: [chruby](https://github.com/postmodern/chruby){:target="_blank"}.

To continue, you also need [Homebrew](https://brew.sh/){:target="_blank"}, which is a package manager for macOS to install a wide range of packages.

**Install required packages**
{% highlight bash %}
brew install chruby ruby-install xz
{% endhighlight %}

**Install ruby**
{% highlight bash %}
ruby-install ruby 3.1.3
{% endhighlight %}

**Configure shell**
{% highlight bash %}
echo "source $(brew --prefix)/opt/chruby/share/chruby/chruby.sh" >> ~/.zshrc
echo "source $(brew --prefix)/opt/chruby/share/chruby/auto.sh" >> ~/.zshrc
echo "chruby ruby-3.1.3" >> ~/.zshrc # run 'chruby' to see actual version
{% endhighlight %}

If you are not using Z shell, I recommend to switch now 😉. If you still want to use Bash, keep in mind to replace `.zshrc` with `.bash_profile` in the commands above.

Relaunch your terminal or source your config, so that the changes are applied.

**Install jekyll and bundler**
{% highlight bash %}
gem install jekyll bundler
{% endhighlight %}

**Generate your project**
{% highlight bash %}
jekyll new myblog
cd myblog
{% endhighlight %}

**Serve site locally**
{% highlight bash %}
bundle exec jekyll serve --livereload
{% endhighlight %}

With the `--livereload` flag, the page refreshes automatically with each change you make.

If you get an error like: `cannot load such file -- webrick`, simply add `webrick` explicitly to your `Gemfile`:
{% highlight ruby %}
gem 'webrick'
{% endhighlight %}

And then run:
{% highlight bash %}
bundle install
bundle exec jekyll serve --livereload
{% endhighlight %}

Now simply open [http://localhost:4000](http://localhost:4000){:target="_blank"} in your browser, and there you go, your first static site with Jekyll is ready.

![Sample page]({{site.baseurl}}/images/blog/2024-02-18-01.png)

As a data engineer and software developer for backend systems, I like the approach of working with Markdown a lot. I hope this inspires you to start your own Jekyll project, and if you do so: feel free to reach out and share your results.
