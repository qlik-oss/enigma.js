# Contributing to enigma.js

You are more than welcome to contribute to enigma.js! Follow these guidelines and you will be ready to start:

 - [Code of conduct](#code-of-conduct)
 - [Bugs](#bugs)
 - [Features](#features)
 - [Documentation](#documentation)
 - [Developing](#developing)
 - [Git guidelines](#git)
 - [Signing the CLA](#cla)

## <a name="code-of-conduct"></a> Code of conduct

Please read and follow our [Code of conduct](https://github.com/qlik-oss/open-source/blob/master/CODE_OF_CONDUCT.md).

## <a name="bugs"></a> Bugs

Bugs can be reported by adding issues in the repository. Submit your bug fix by creating a Pull Request, following the [GIT guidelines](#git).

## <a name="features"></a> Features

Features can be requested by adding issues in the repository. If the feature includes new designs or bigger changes,
please be prepared to discuss the changes with us so we can cooperate on how to best include them.

Submit your feature by creating a Pull Request, following the [GIT guidelines](#git). Include any related documentation changes.


## <a name="documentation"></a> Documentation changes

Documentation changes can be requested by adding issues in the repository.

Submit your documentation changes by creating a Pull Request, following the [GIT guidelines](#git).
If the change is minor, you can submit a Pull Request directly without creating an issue first.

## Developing

Begin by installing all dependencies:

```sh
$ npm install
```

Building the project:

```sh
$ npm run build
```

Generating JSDoc:

```sh
$ npm run jsdoc
```

Running unit and component tests:

```sh
$ npm run test
```

Linting files:

```sh
$ npm run lint
```

## <a name="git"></a> Git Guidelines

Generally, development should be done directly towards the `master` branch.

### Workflow

1\. Fork and clone the repository

```sh
git clone git@github.com:YOUR-USERNAME/enigma.js.git
```

2\. Create a branch in the fork

The branch should be based on the `master` branch in the master repository.

```sh
git checkout -b my-feature-or-bugfix master
```

3\. Commit changes on your branch

Commit changes to your branch, following the commit message format.

```sh
git commit -m "Fix outKey being sent in all requests."
```

4\. Push the changes to your fork

```sh
git push -u myfork my-feature-or-bugfix
```

5\. Create a Pull Request

Before creating a Pull Request, make sure the following items are satisfied:

- CircleCI is green
- Commit message format is followed
- [CLA](#cla) is signed

In the Github UI of your fork, create a Pull Request to the `master` branch of the master repository.

If the branch has merge conflicts or has been outdated, please do a rebase against the `master` branch.

_WARNING: Squashing or reverting commits and force-pushing thereafter may remove GitHub comments on code that were previously made by you or others in your commits. Avoid any form of rebasing unless necessary._


### Commit message format

There are currently no conventions on how to format commit messages. We'd like you to follow some rules on the content however:

- Use the present form, e.g. _Add schema file for Qlik Sense 3.1_
- Be descriptive and avoid messages like _Minor fix_.
- If the change is breaking an API, add a _[breaking]_ tag in the message.

Some examples of good commit messages:

- _Fix outKey being sent in all requests._
- _Bump after-work.js to 0.12.9_
- _Rename communication module to registry_


## <a name="cla"></a> Signing the CLA

We need you to sign our Contributor License Agreement (CLA) before we can accept your Pull Request. Visit this link for more information: https://github.com/qlik-oss/open-source/blob/master/sign-cla.md.
