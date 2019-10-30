# How to release enigma.js
0. Check that commits since last release
0. Add changes to CHANGELOG.md
0. Run `npm version major` (or `minor` or `patch`) depending on the changes that have been made
0. Create a new branch with the changes and put a PR up for review
0. When the PR is merged, push a tag with the new version to github. 
0. Checkout the master branch, pull it and run `npm publish` to publish to NPM
