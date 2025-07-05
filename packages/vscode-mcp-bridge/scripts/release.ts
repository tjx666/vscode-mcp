#!/usr/bin/env tsx

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function execCommand(command: string): void {
    console.log(`Running: ${command}`);
    try {
        execSync(command, { stdio: 'inherit' });
    } catch {
        console.error(`Failed to execute: ${command}`);
        process.exit(1);
    }
}

function getVersion(): string {
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
}

function main(): void {
    const version = getVersion();
    const tag = `v${version}`;
    
    console.log(`Creating release for version ${version}`);
    
    // Create and push tag
    execCommand(`git tag ${tag}`);
    execCommand(`git push origin ${tag}`);
    
    console.log(`Release ${tag} created successfully!`);
}

main();