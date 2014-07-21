---
layout: default
title: delite/theme!
---

# delite/theme!

Delite/theme! is a high level plugin for loading a CSS file based on the theme of the page.

The plugin is similar to the CSS loader, but will substitute {{theme}} with the page's theme.

	theme!./a/b/{{theme}}/file1.css,./a/b/{{theme}}/file2.css

The requirements are that:

- there is an a/b directory relative to the current directory
- it contains subdirectories holodark, ios, and bootstrap
- each of those subdirectories contains file1.css and file2.css

The theme is detected automatically based on the platform and browser, and the correct file is loaded as well as the global css file for the theme.

You can alternately pass an additional URL parameter string
theme={theme widget} to force a specific theme through the browser
URL input.

The available theme ids are:

- bootstrap
- holodark (theme introduced in Android 3.0)
- ios

The theme names are case-sensitive.
