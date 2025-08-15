<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# SPDX License Identifier Guide

This document provides guidance on adding SPDX license identifiers to all source files in the EHR Wallet project, as required by the Technical Charter.

## License Information

This work is licensed under a Creative Commons Attribution 4.0 International License.

## Overview

SPDX (Software Package Data Exchange) license identifiers provide a standardized way to communicate license information. All source files in this project must include appropriate SPDX identifiers.

## Required Identifiers

### Source Code Files
- **License**: Apache-2.0
- **Files**: `.ts`, `.tsx`, `.js`, `.jsx`, `.sol`, `.py`, etc.
- **Format**: `// SPDX-License-Identifier: Apache-2.0`

### Documentation Files
- **License**: CC-BY-4.0 (Creative Commons Attribution 4.0)
- **Files**: `.md`, `.rst`, `.txt` documentation
- **Format**: `<!-- SPDX-License-Identifier: CC-BY-4.0 -->`

### Configuration Files
- **License**: Apache-2.0
- **Files**: `.json`, `.yml`, `.yaml`, `.toml`, etc.
- **Format**: `# SPDX-License-Identifier: Apache-2.0`

## Implementation Examples

### TypeScript/JavaScript Files
```typescript
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
// ... rest of the file
```

### Markdown Documentation
```markdown
<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Document Title
// ... rest of the document
```

### JSON Configuration
```json
{
  "_comment": "SPDX-License-Identifier: Apache-2.0",
  "name": "ehr-wallet"
}
```

### YAML Configuration
```yaml
# SPDX-License-Identifier: Apache-2.0
name: EHR Wallet
```

### Solidity Smart Contracts
```solidity
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;
// ... contract code
```

## Implementation Checklist

- [ ] Add SPDX identifiers to all TypeScript/JavaScript source files
- [ ] Add SPDX identifiers to all React component files
- [ ] Add SPDX identifiers to all Solidity smart contracts
- [ ] Add SPDX identifiers to all configuration files
- [ ] Add SPDX identifiers to all documentation files
- [ ] Verify identifiers are placed at the top of each file
- [ ] Ensure proper comment syntax for each file type

## Automation

Consider implementing pre-commit hooks or CI/CD checks to automatically verify SPDX identifier presence in new files.

## References

- [SPDX License List](https://spdx.org/licenses/)
- [Apache License 2.0](https://spdx.org/licenses/Apache-2.0.html)
- [Creative Commons Attribution 4.0](https://spdx.org/licenses/CC-BY-4.0.html)