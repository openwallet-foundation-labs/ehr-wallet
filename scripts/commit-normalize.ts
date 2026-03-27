#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

interface Commit {
  hash: string;
  message: string;
  originalMessage: string;
}

interface NormalizedCommit extends Commit {
  normalizedMessage: string;
}

interface NormalizeOptions {
  dryRun: boolean;
  filterBranch: boolean;
  startRef?: string;
  endRef?: string;
}

const NIGHTSHIFT_TASK = 'Nightshift-Task: commit-normalize';
const NIGHTSHIFT_REF = 'Nightshift-Ref: https://github.com/marcus/nightshift';

const CONVENTIONAL_TYPES = [
  'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'
];

function runCommand(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
  } catch (error: unknown) {
    if (error instanceof Error && 'stdout' in error) {
      return (error as { stdout: string }).stdout || '';
    }
    return '';
  }
}

function parseCommitFormat(format: string): { hash: string; message: string } {
  const lines = format.split('\n');
  const hash = lines[0] || '';
  const message = lines.slice(1).join('\n').trim();
  return { hash, message };
}

function getCommits(startRef?: string, endRef?: string): Commit[] {
  const range = startRef && endRef ? `${startRef}..${endRef}` : startRef || 'HEAD';
  const format = runCommand(`git log --format="%H%n%s" ${range}`).trim();

  if (!format) {
    return [];
  }

  const commitBlocks = format.split('\n\n');
  const commits: Commit[] = [];

  for (const block of commitBlocks) {
    if (!block.trim()) continue;
    const lines = block.split('\n');
    const hash = lines[0] || '';
    const message = lines.slice(1).join('\n').trim();

    if (hash && message) {
      commits.push({ hash, message, originalMessage: message });
    }
  }

  return commits;
}

function extractType(message: string): string | null {
  const match = message.match(/^([a-z]+)/i);
  if (match && CONVENTIONAL_TYPES.includes(match[1].toLowerCase())) {
    return match[1].toLowerCase();
  }
  return null;
}

function extractScope(message: string): string | null {
  const match = message.match(/^([a-z]+)\(([^)]+)\)/i);
  if (match) {
    return match[2];
  }
  return null;
}

function normalizeMessage(message: string): string {
  const trimmed = message.trim();

  const type = extractType(trimmed);
  const scope = extractScope(trimmed);

  let description = trimmed;

  if (type) {
    const typeIndex = description.search(new RegExp(`^${type}`, 'i'));
    if (typeIndex !== -1) {
      description = description.slice(typeIndex + type.length).trim();
    }

    if (description.startsWith('(')) {
      const scopeEnd = description.indexOf(')');
      if (scopeEnd !== -1) {
        description = description.slice(scopeEnd + 1).trim();
      }
    }

    if (description.startsWith(':')) {
      description = description.slice(1).trim();
    }
  }

  description = description.replace(/^\s*[-–—]\s*/, '').trim();

  description = description
    .replace(/\s+/g, ' ')
    .replace(/[.\s]+$/, '')
    .trim();

  if (!description) {
    description = '<description>';
  }

  if (type) {
    let normalized = `${type}:`;
    if (scope) {
      normalized += ` (${scope})`;
    }
    normalized += ` ${description}`;
    return normalized;
  }

  return `chore: ${description}`;
}

function addTrailers(message: string): string {
  const lines = message.split('\n');
  const contentLines: string[] = [];
  let hasTrailers = false;

  for (const line of lines) {
    if (line.startsWith('Nightshift-')) {
      hasTrailers = true;
    }
    contentLines.push(line);
  }

  if (!hasTrailers) {
    contentLines.push('');
    contentLines.push(NIGHTSHIFT_TASK);
    contentLines.push(NIGHTSHIFT_REF);
  }

  return contentLines.join('\n');
}

function normalizeCommit(commit: Commit): NormalizedCommit {
  const normalizedMessage = normalizeMessage(commit.message);
  const withTrailers = addTrailers(normalizedMessage);

  return {
    ...commit,
    normalizedMessage: withTrailers,
  };
}

function formatForReview(commits: NormalizedCommit[]): string {
  const lines: string[] = [];

  for (const commit of commits) {
    lines.push(`Commit: ${commit.hash.slice(0, 7)}`);
    lines.push('--- Original:');
    lines.push(commit.originalMessage);
    lines.push('--- Normalized:');
    lines.push(commit.normalizedMessage);
    lines.push('');
  }

  return lines.join('\n');
}

function formatForFilterBranch(commits: NormalizedCommit[]): string {
  const lines: string[] = [];

  for (const commit of commits) {
    lines.push(`${commit.hash}|${commit.normalizedMessage.replace(/\n/g, '|')}`);
  }

  return lines.join('\n');
}

function createCommitMessageFile(commit: NormalizedCommit, filePath: string): void {
  fs.writeFileSync(filePath, commit.normalizedMessage);
}

function applyNormalize(commits: NormalizedCommit[], dryRun: boolean): void {
  if (commits.length === 0) {
    return;
  }

  if (dryRun) {
    console.log('DRY RUN - No changes will be applied');
    console.log('');
  }

  const tmpDir = fs.mkdtempSync('.commit-normalize-');
  const scriptLines: string[] = [];

  for (let i = commits.length - 1; i >= 0; i--) {
    const commit = commits[i];
    const msgFile = `${tmpDir}/msg-${i}`;

    if (dryRun) {
      console.log(`Would amend commit: ${commit.hash.slice(0, 7)}`);
      console.log(`New message: ${commit.normalizedMessage.split('\n')[0]}`);
      console.log('');
    } else {
      createCommitMessageFile(commit, msgFile);
      scriptLines.push(`exec git commit --amend -F ${msgFile} --no-verify`);
    }
  }

  if (!dryRun && scriptLines.length > 0) {
    const firstCommit = commits[commits.length - 1];
    const lastCommit = commits[0];
    const rebaseScript = `${tmpDir}/rebase`;

    fs.writeFileSync(rebaseScript, scriptLines.join('\n') + '\n');
    console.log(`Applying normalized messages to ${commits.length} commit(s)...`);

    try {
      runCommand(`git rebase -i --exec "${rebaseScript}" ${lastCommit.hash}^`);
    } catch {
      console.error('Rebase failed. Manual intervention may be required.');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}

function main() {
  const args = process.argv.slice(2);

  let dryRun = false;
  let filterBranch = false;
  let apply = false;
  let startRef: string | undefined;
  let endRef: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run' || args[i] === '-n') {
      dryRun = true;
    } else if (args[i] === '--filter-branch' || args[i] === '-f') {
      filterBranch = true;
    } else if (args[i] === '--apply' || args[i] === '-a') {
      apply = true;
    } else if (args[i] === '--range' || args[i] === '-r') {
      if (i + 2 < args.length) {
        startRef = args[i + 1];
        endRef = args[i + 2];
        i += 2;
      }
    } else if (!args[i].startsWith('-')) {
      if (!startRef) {
        startRef = args[i];
      } else if (!endRef) {
        endRef = args[i];
      }
    }
  }

  const commits = getCommits(startRef, endRef);

  if (commits.length === 0) {
    console.log('No commits found.');
    return;
  }

  const normalized = commits.map(normalizeCommit);

  if (filterBranch) {
    console.log(formatForFilterBranch(normalized));
  } else if (apply && !dryRun) {
    applyNormalize(normalized, false);
  } else {
    applyNormalize(normalized, dryRun);
  }
}

main();