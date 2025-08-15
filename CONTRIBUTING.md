<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Contributing to EHR Wallet

Thank you for your interest in contributing to the EHR Wallet! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
  - [Setting up the Development Environment](#setting-up-the-development-environment)
  - [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
  - [Branching Strategy](#branching-strategy)
  - [Commit Messages](#commit-messages)
  - [Pull Requests](#pull-requests)
- [Testing](#testing)
- [Documentation](#documentation)
- [Web3 Development Guidelines](#web3-development-guidelines)

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please report unacceptable behavior to [project-admin@example.com].

## Getting Started

### Setting up the Development Environment

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/[your-username]/radiant-flow-imaging-hub.git
   cd radiant-flow-imaging-hub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your local configuration
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Project Structure

- `/app`: Next.js application routes
- `/components`: Reusable React components
- `/lib`: Utility functions and shared code
- `/prisma`: Database schema and migrations
- `/public`: Static assets
- `/styles`: Global CSS and styling utilities
- `/web3`: Smart contracts and blockchain interactions

## Development Workflow

### Branching Strategy

We follow a simplified Git flow:

- `main`: Reflects the production state
- `develop`: Integration branch for features
- Feature branches: `feature/[feature-name]`
- Bug fix branches: `fix/[bug-name]`

### Commit Messages

Please follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types include:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style/formatting changes
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Changes to build process or tools

### Pull Requests

1. Pull requests should target the `develop` branch.
2. Ensure your code passes all tests.
3. Update documentation as needed.
4. Request reviews from maintainers.

## Testing

- Write tests for all new features and bug fixes.
- Run tests locally before submitting a PR:
  ```bash
  npm test
  ```

## Documentation

- Update README.md for user-facing changes.
- Document code with appropriate JSDoc comments.
- Update API documentation for any changes to backend services.

## Web3 Development Guidelines

For Web3 features (patient data sharing, wallet integration, etc.):

1. Smart Contracts:
   - Follow the [Solidity Style Guide](https://docs.soliditylang.org/en/v0.8.15/style-guide.html)
   - Include thorough comments
   - Implement proper access control

2. Wallet Integration:
   - Support MetaMask (primary)
   - Follow security best practices for key management

3. IPFS Storage:
   - Document the IPFS schema for stored data
   - Implement proper encryption for sensitive data

## Developer Certificate of Origin (DCO)

This project requires all contributors to sign off on their commits using the Developer Certificate of Origin (DCO). This certifies that you have the right to submit your contribution under the project's license.

### How to Sign Off

To sign off on your commits, add the `-s` flag when committing:

```bash
git commit -s -m "Your commit message"
```

This will automatically add a "Signed-off-by" line to your commit message:

```
Signed-off-by: Your Name <your.email@example.com>
```

### DCO Text

By signing off on your commits, you certify that:

```
Developer Certificate of Origin
Version 1.1

Copyright (C) 2004, 2006 The Linux Foundation and its contributors.

Everyone is permitted to copy and distribute verbatim copies of this
license document, but changing it is not allowed.

Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the open source license
    indicated in the file; or

(b) The contribution is based upon previous work that, to the best
    of my knowledge, is covered under an appropriate open source
    license and I have the right under that license to submit that
    work with modifications, whether created in whole or in part
    by me, under the same open source license (unless I am
    permitted to submit under a different license), as indicated
    in the file; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified
    it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution (including all
    personal information I submit with it, including my sign-off) is
    maintained indefinitely and may be redistributed consistent with
    this project or the open source license(s) involved.
```

### Automated DCO Checking

All pull requests are automatically checked for DCO compliance using GitHub Actions. Commits without proper sign-off will be rejected.

## Documentation License

This documentation is licensed under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).

Thank you for helping to improve the EHR Wallet!
