#!/usr/bin/env npx ts-node

/**
 * Doc Drift Detector
 *
 * Scans API route files and compares them against documented endpoints
 * to identify when documentation falls out of sync with actual code implementation.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types for drift detection results
export interface EndpointMethod {
  method: string;
  filePath: string;
  lineNumber: number;
}

export interface ParsedRoute {
  path: string;
  methods: EndpointMethod[];
  filePath: string;
}

export interface DocumentedEndpoint {
  path: string;
  method: string;
  description: string;
  lineNumber: number;
}

export interface DriftFinding {
  type: 'undocumented_route' | 'missing_documentation' | 'path_mismatch' | 'method_mismatch';
  severity: 'high' | 'medium' | 'low';
  message: string;
  route?: string;
  method?: string;
  filePath?: string;
  documentedIn?: string;
}

export interface DriftReport {
  timestamp: string;
  scannedRoutes: number;
  documentedEndpoints: number;
  undocumentedRoutes: DriftFinding[];
  missingDocs: DriftFinding[];
  pathMismatches: DriftFinding[];
  methodMismatches: DriftFinding[];
  summary: {
    totalFindings: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
  };
}

/**
 * Recursively find all .ts files in a directory
 */
function findTsFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findTsFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract API path from file path
 * e.g., /pages/api/shared-data/index.ts -> /api/shared-data
 * e.g., /pages/api/auth/[...nextauth].ts -> /api/auth/[...nextauth]
 */
function extractApiPath(filePath: string): string {
  const pagesApiMatch = filePath.match(/pages\/api\/(.+)\.ts$/);
  if (!pagesApiMatch) return '';

  let apiPath = pagesApiMatch[1];

  // Handle index files - they represent the parent path
  if (apiPath.endsWith('/index')) {
    apiPath = apiPath.replace(/\/index$/, '');
  }

  // Handle dynamic routes with [param] or [...slug] patterns
  apiPath = apiPath.replace(/\[([^\]]+)\]/g, '[$1]');

  return `/api/${apiPath}`;
}

/**
 * Extract HTTP methods from an API route file by analyzing the code
 */
function extractMethods(filePath: string, content: string): EndpointMethod[] {
  const methods: EndpointMethod[] = [];

  // Pattern 1: switch(req.method) with case statements
  const methodSwitchMatch = content.match(/switch\s*\(\s*req\.method\s*\)/);
  if (methodSwitchMatch) {
    const switchIndex = content.indexOf(methodSwitchMatch[0]);
    const switchContent = content.slice(switchIndex);

    // Match case 'GET', case 'POST', etc.
    const casePattern = /case\s+['"](GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)['"]/gi;
    let match;
    while ((match = casePattern.exec(switchContent)) !== null) {
      const method = match[1].toUpperCase();
      const lineNumber = content.slice(0, switchIndex + match.index).split('\n').length;
      methods.push({ method, filePath, lineNumber });
    }
  }

  // Pattern 2: Direct method checks like if (req.method !== 'GET')
  // Look for common patterns in handler functions
  const handlerMatch = content.match(/export\s+default\s+(async\s+)?function\s+handler/);
  if (handlerMatch && methods.length === 0) {
    // If there's a handler but no switch statement, check for explicit method checks
    const getMatch = content.match(/req\.method\s*[!=]==?\s*['"]GET['"]/gi);
    const postMatch = content.match(/req\.method\s*[!=]==?\s*['"]POST['"]/gi);
    const putMatch = content.match(/req\.method\s*[!=]==?\s*['"]PUT['"]/gi);
    const deleteMatch = content.match(/req\.method\s*[!=]==?\s*['"]DELETE['"]/gi);
    const patchMatch = content.match(/req\.method\s*[!=]==?\s*['"]PATCH['"]/gi);

    if (getMatch) {
      const lineNumber = findLineNumber(content, getMatch[0]);
      methods.push({ method: 'GET', filePath, lineNumber });
    }
    if (postMatch) {
      const lineNumber = findLineNumber(content, postMatch[0]);
      methods.push({ method: 'POST', filePath, lineNumber });
    }
    if (putMatch) {
      const lineNumber = findLineNumber(content, putMatch[0]);
      methods.push({ method: 'PUT', filePath, lineNumber });
    }
    if (deleteMatch) {
      const lineNumber = findLineNumber(content, deleteMatch[0]);
      methods.push({ method: 'DELETE', filePath, lineNumber });
    }
    if (patchMatch) {
      const lineNumber = findLineNumber(content, patchMatch[0]);
      methods.push({ method: 'PATCH', filePath, lineNumber });
    }
  }

  // Pattern 3: For files that export a handler directly without method checks
  // Default to allowing all methods (405 response)
  if (methods.length === 0 && handlerMatch) {
    // Check if there's a 405 response indicating method handling
    if (content.includes('405') && content.includes('Method not allowed')) {
      // This file handles methods but we don't know which ones
      // Mark as multi-method capable
      methods.push({ method: 'GET/POST/PUT/DELETE', filePath, lineNumber: 0 });
    }
  }

  return methods;
}

function findLineNumber(content: string, searchString: string): number {
  const index = content.indexOf(searchString);
  if (index === -1) return 0;
  return content.slice(0, index).split('\n').length;
}

/**
 * Scan all API route files and extract route information
 */
function scanApiRoutes(pagesApiDir: string): ParsedRoute[] {
  const routes: ParsedRoute[] = [];
  const files = findTsFiles(pagesApiDir);

  for (const file of files) {
    const apiPath = extractApiPath(file);

    if (!apiPath) continue;

    try {
      const content = fs.readFileSync(file, 'utf-8');
      const methods = extractMethods(file, content);

      if (methods.length > 0) {
        routes.push({
          path: apiPath,
          methods,
          filePath: file,
        });
      }
    } catch (error) {
      console.warn(`Warning: Could not read file ${file}: ${error}`);
    }
  }

  return routes;
}

/**
 * Parse documented endpoints from API.md
 */
function parseDocumentation(docPath: string): DocumentedEndpoint[] {
  const endpoints: DocumentedEndpoint[] = [];

  try {
    const content = fs.readFileSync(docPath, 'utf-8');

    // Pattern to match endpoint documentation
    // e.g., ### `/api/auth/register` (POST)
    // e.g., ### `/api/access-logs` (GET)
    // e.g., #### `GET /api/shared-data`
    const endpointPattern = /###\s+`(\/api\/[^`]+)`\s*\(([^)]+)\)/g;
    const inlineEndpointPattern = /####\s+`(\w+)\s+(\/api\/[^`]+)`/g;

    let match;

    // Match ### `/api/path` (METHODS) pattern
    while ((match = endpointPattern.exec(content)) !== null) {
      const docPath = match[1];
      const methodsStr = match[2];
      const methods = methodsStr.split(',').map(m => m.trim().toUpperCase());
      const lineNumber = content.slice(0, match.index).split('\n').length;

      for (const method of methods) {
        endpoints.push({
          path: docPath,
          method,
          description: '',
          lineNumber,
        });
      }
    }

    // Match #### `METHOD /api/path` pattern
    while ((match = inlineEndpointPattern.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const docPath = match[2];
      const lineNumber = content.slice(0, match.index).split('\n').length;

      endpoints.push({
        path: docPath,
        method,
        description: '',
        lineNumber,
      });
    }

  } catch (error) {
    console.warn(`Warning: Could not read documentation file ${docPath}: ${error}`);
  }

  return endpoints;
}

/**
 * Normalize paths for comparison
 * e.g., /api/shared-data/[id] matches documented /api/shared-data/{id}
 */
function normalizePathForComparison(apiPath: string): string {
  return apiPath
    .replace(/\[([^\]]+)\]/g, '{$1}')  // [id] -> {id}
    .replace(/\[\.\.\.([^\]]+)\]/g, '{$1...}');  // [...slug] -> {slug...}
}

/**
 * Check if two paths match (considering path parameters)
 */
function pathsMatch(docPath: string, apiPath: string): boolean {
  const normalizedDoc = normalizePathForComparison(docPath);
  const normalizedApi = normalizePathForComparison(apiPath);
  return normalizedDoc === normalizedApi;
}

/**
 * Detect drift between actual routes and documentation
 */
function detectDrift(
  routes: ParsedRoute[],
  documented: DocumentedEndpoint[]
): DriftReport {
  const findings: DriftFinding[] = [];

  // Check for undocumented routes
  for (const route of routes) {
    const matchingDocs = documented.filter(
      d => pathsMatch(d.path, route.path)
    );

    if (matchingDocs.length === 0) {
      // Route is not documented at all
      for (const method of route.methods) {
        findings.push({
          type: 'undocumented_route',
          severity: 'high',
          message: `Route ${route.path} (${method.method}) is not documented`,
          route: route.path,
          method: method.method,
          filePath: method.filePath,
        });
      }
    } else {
      // Check for undocumented methods
      for (const method of route.methods) {
        const methodDocs = matchingDocs.find(
          d => d.method === method.method ||
               method.method.includes(d.method) ||
               d.method.includes(method.method)
        );

        if (!methodDocs) {
          findings.push({
            type: 'method_mismatch',
            severity: 'medium',
            message: `Method ${method.method} on ${route.path} is not documented`,
            route: route.path,
            method: method.method,
            filePath: method.filePath,
          });
        }
      }
    }
  }

  // Check for missing documentation (documented but no route exists)
  for (const doc of documented) {
    const matchingRoutes = routes.filter(r => pathsMatch(doc.path, r.path));

    if (matchingRoutes.length === 0) {
      findings.push({
        type: 'missing_documentation',
        severity: 'high',
        message: `Endpoint ${doc.path} (${doc.method}) is documented but no route file exists`,
        route: doc.path,
        method: doc.method,
        documentedIn: `/docs/API.md:${doc.lineNumber}`,
      });
    } else {
      // Check if the documented method exists in the route
      const route = matchingRoutes[0];
      const hasMethod = route.methods.some(
        m => m.method === doc.method ||
             m.method.includes(doc.method) ||
             doc.method.includes(m.method)
      );

      if (!hasMethod) {
        findings.push({
          type: 'missing_documentation',
          severity: 'medium',
          message: `Method ${doc.method} on ${doc.path} is documented but not implemented in ${route.filePath}`,
          route: doc.path,
          method: doc.method,
          filePath: route.filePath,
          documentedIn: `/docs/API.md:${doc.lineNumber}`,
        });
      }
    }
  }

  // Categorize findings
  const undocumentedRoutes = findings.filter(f => f.type === 'undocumented_route');
  const missingDocs = findings.filter(f => f.type === 'missing_documentation');
  const pathMismatches = findings.filter(f => f.type === 'path_mismatch');
  const methodMismatches = findings.filter(f => f.type === 'method_mismatch');

  return {
    timestamp: new Date().toISOString(),
    scannedRoutes: routes.length,
    documentedEndpoints: documented.length,
    undocumentedRoutes,
    missingDocs,
    pathMismatches,
    methodMismatches,
    summary: {
      totalFindings: findings.length,
      highSeverity: findings.filter(f => f.severity === 'high').length,
      mediumSeverity: findings.filter(f => f.severity === 'medium').length,
      lowSeverity: findings.filter(f => f.severity === 'low').length,
    },
  };
}

/**
 * Print human-readable report
 */
function printReport(report: DriftReport): void {
  console.log('\n' + '='.repeat(60));
  console.log('DOC DRIFT DETECTION REPORT');
  console.log('='.repeat(60));
  console.log(`\nTimestamp: ${report.timestamp}`);
  console.log(`Routes Scanned: ${report.scannedRoutes}`);
  console.log(`Documented Endpoints: ${report.documentedEndpoints}`);

  console.log('\n' + '-'.repeat(40));
  console.log('SUMMARY');
  console.log('-'.repeat(40));
  console.log(`Total Findings: ${report.summary.totalFindings}`);
  console.log(`  High Severity: ${report.summary.highSeverity}`);
  console.log(`  Medium Severity: ${report.summary.mediumSeverity}`);
  console.log(`  Low Severity: ${report.summary.lowSeverity}`);

  if (report.undocumentedRoutes.length > 0) {
    console.log('\n' + '-'.repeat(40));
    console.log('UNDOCUMENTED ROUTES (High Priority)');
    console.log('-'.repeat(40));
    for (const finding of report.undocumentedRoutes) {
      console.log(`\n  ${finding.route} [${finding.method}]`);
      console.log(`    File: ${finding.filePath}`);
      console.log(`    ${finding.message}`);
    }
  }

  if (report.missingDocs.length > 0) {
    console.log('\n' + '-'.repeat(40));
    console.log('MISSING DOCUMENTATION (High Priority)');
    console.log('-'.repeat(40));
    for (const finding of report.missingDocs) {
      console.log(`\n  ${finding.route} [${finding.method}]`);
      console.log(`    ${finding.message}`);
      if (finding.documentedIn) {
        console.log(`    Documented at: ${finding.documentedIn}`);
      }
    }
  }

  if (report.methodMismatches.length > 0) {
    console.log('\n' + '-'.repeat(40));
    console.log('METHOD MISMATCHES (Medium Priority)');
    console.log('-'.repeat(40));
    for (const finding of report.methodMismatches) {
      console.log(`\n  ${finding.route} [${finding.method}]`);
      console.log(`    ${finding.message}`);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Main function
 */
async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const pagesApiDir = path.join(projectRoot, 'pages', 'api');
  const docPath = path.join(projectRoot, 'docs', 'API.md');

  console.log('Doc Drift Detector');
  console.log('===================\n');
  console.log(`Scanning API routes in: ${pagesApiDir}`);
  console.log(`Parsing documentation from: ${docPath}\n`);

  // Scan API routes
  console.log('Scanning API routes...');
  const routes = scanApiRoutes(pagesApiDir);
  console.log(`Found ${routes.length} route files\n`);

  // Parse documentation
  console.log('Parsing API documentation...');
  const documented = parseDocumentation(docPath);
  console.log(`Found ${documented.length} documented endpoints\n`);

  // Detect drift
  console.log('Detecting drift...\n');
  const report = detectDrift(routes, documented);

  // Print report
  printReport(report);

  // Output JSON report
  const jsonReportPath = path.join(projectRoot, 'doc-drift-report.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
  console.log(`JSON report saved to: ${jsonReportPath}\n`);

  // Exit with appropriate code
  if (report.summary.highSeverity > 0) {
    console.log('High severity drift detected. Please review and update documentation.');
    process.exit(1);
  } else if (report.summary.mediumSeverity > 0) {
    console.log('Medium severity drift detected. Consider updating documentation.');
    process.exit(0);
  } else {
    console.log('No significant drift detected. Documentation is up to date.');
    process.exit(0);
  }
}

// Run if executed directly
main().catch((error) => {
  console.error('Error running doc drift detector:', error);
  process.exit(1);
});