# enigma.js profiling

This directory contains some simple CPU and memory profiling scripts.

Requirements:

* \*NIX environment (Git Bash or Mac/Linux terminals)
* Node >= 8.0
* Running QIX Engine on localhost:4848 (unless you adjust it in `profile.js`)

These scripts will generate files that you may analyze to identify potential
CPU or memory performance issues.

```sh
$ cd test/profile
$ ./cpu-profile.sh
$ ./mem-profile.sh
```
