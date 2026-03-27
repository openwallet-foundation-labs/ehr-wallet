#!/usr/bin/env node

import { execSync } from 'child_process';
import * as fs from 'fs';

interface Commit {
  hash: string;
  message: string;
  body?: string;
  originalMessage: string;
}

interface NormalizedCommit extends Commit {
  normalizedMessage: string;
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
    throw error instanceof Error ? error : new Error(String(error));
  }
}

function getCommits(startRef?: string, endRef?: string): Commit[] {
  const range = startRef && endRef ? `${startRef}..${endRef}` : startRef || 'HEAD';
  const format = runCommand(`git log --format="%H%n%s%n%b" ${range}`).trim();

  if (!format) {
    return [];
  }

  // Split by commit separator (hash line pattern: 40 hex chars)
  const parts = format.split(/\n\n(?=[a-f0-9]{40}\n)/);
  const commits: Commit[] = [];

  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.split('\n');
    const hash = lines[0] || '';
    const subject = lines[1] || '';
    const body = lines.slice(2).join('\n').trim();

    if (hash && subject) {
      commits.push({ hash, message: subject, body, originalMessage: subject });
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
  let hasTrailers = false;

  // Check if message already ends with Nightshift trailers
  for (const line of lines) {
    if (line.startsWith('Nightshift-')) {
      hasTrailers = true;
      break;
    }
  }

  if (hasTrailers) {
    return message;
  }

  return message + '\n\n' + NIGHTSHIFT_TASK + '\n' + NIGHTSHIFT_REF;
}

function normalizeCommit(commit: Commit): NormalizedCommit {
  const normalizedSubject = normalizeMessage(commit.message);
  const withTrailers = addTrailers(normalizedSubject);

  // If there's a body with Nightshift trailers, strip just the trailers but keep the rest
  let bodyContent = commit.body || '';
  if (bodyContent) {
    // Remove lines starting with Nightshift- and any blank lines that follow
    bodyContent = bodyContent
      .split('\n')
      .filter(line => !line.startsWith('Nightshift-'))
      .join('\n')
      .replace(/\n+$/, '')  // Remove trailing newlines
      .trim();
  }

  const fullMessage = bodyContent
    ? `${withTrailers}\n\n${bodyContent}`
    : withTrailers;

  return {
    ...commit,
    normalizedMessage: fullMessage,
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
    for (const commit of commits) {
      console.log(`Would rewrite commit: ${commit.hash.slice(0, 7)}`);
      console.log(`New message: ${commit.normalizedMessage.split('\n')[0]}`);
      console.log('');
    }
    return;
  }

  const tmpDir = fs.mkdtempSync('.commit-normalize-');

  // Create message files for each commit (processed in reverse order for rebase)
  for (let i = 0; i < commits.length; i++) {
    const msgFile = `${tmpDir}/msg-${i}.txt`;
    fs.writeFileSync(msgFile, commits[i].normalizedMessage);
  }

  // Build the rebase todo list using the script approach
  // Each line is: exec /path/to/script.sh i
  const scriptLines: string[] = ['#!/bin/bash'];
  scriptLines.push(`MSG_FILE="${tmpDir}/msg-$1.txt"`);
  scriptLines.push('git commit --amend -F "$MSG_FILE" --no-verify --quiet');

  const scriptFile = `${tmpDir}/amend.sh`;
  fs.writeFileSync(scriptFile, scriptLines.join('\n'));
  fs.chmodSync(scriptFile, 0o755);

  // Build the rebase sequence: each commit is amended then re-committed
  const firstCommit = commits[commits.length - 1].hash;
  const lastCommit = commits[0].hash;

  // Use git rebase -i with exec commands
  // The sequence is: pick commit1, exec amend, pick commit2, exec amend, ...
  // We use --allow-empty below to handle the fact that amend doesn't create new commits
  const todoLines: string[] = [];
  for (let i = commits.length - 1; i >= 0; i--) {
    const shortHash = commits[i].hash.slice(0, 7);
    todoLines.push(`pick ${shortHash} normalize-${i}`);
    todoLines.push(`exec ${scriptFile} ${i}`);
  }

  const todoFile = `${tmpDir}/todo`;
  fs.writeFileSync(todoFile, todoLines.join('\n'));

  console.log(`Applying normalized messages to ${commits.length} commit(s)...`);
  console.log('');
  console.log('NOTE: This operation will rewrite commit history.');
  console.log('Make sure you have a backup or are working on a feature branch.');
  console.log('');

  try {
    runCommand(`GIT_SEQUENCE_EDITOR="cat ${todoFile}" git rebase -i ${firstCommit}^ --keep-empty`);
    console.log('Done! Commit messages have been rewritten.');
  } catch (error) {
    console.error('Rebase failed:', error instanceof Error ? error.message : String(error));
    console.error('');
    console.error('Try running: git rebase --abort');
    console.error('Then use --filter-branch mode to pipe to git filter-branch manually.');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
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
  } else if (dryRun) {
    applyNormalize(normalized, true);
  } else {
    console.log(formatForReview(normalized));
  }
}

main();