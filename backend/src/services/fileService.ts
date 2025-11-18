import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const TEMP_DIR = path.join(process.cwd(), 'temp');

/**
 * Ensures the temp directory exists
 */
async function ensureTempDir(): Promise<void> {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create temp directory: ${error}`);
  }
}

/**
 * Creates a temporary directory for code execution
 * @returns Path to the temporary directory
 */
export async function createTempDir(): Promise<string> {
  await ensureTempDir();
  const dirPath = path.join(TEMP_DIR, uuidv4());
  await fs.mkdir(dirPath, { recursive: true });
  return dirPath;
}

/**
 * Writes code to a file in the temp directory
 * @param dirPath Temporary directory path
 * @param code C++ code to write
 * @returns Path to the created file
 */
export async function writeCodeToFile(dirPath: string, code: string): Promise<string> {
  const filePath = path.join(dirPath, 'main.cpp');
  await fs.writeFile(filePath, code, 'utf-8');
  return filePath;
}

/**
 * Removes a temporary directory and all its contents
 * @param dirPath Path to the directory to remove
 */
export async function cleanupTempDir(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    // Log error but don't throw - cleanup failures shouldn't break the flow
    console.error(`Failed to cleanup temp directory ${dirPath}:`, error);
  }
}

/**
 * Validates code size
 * @param code Code to validate
 * @param maxSize Maximum allowed size in bytes
 * @throws Error if code exceeds max size
 */
export function validateCodeSize(code: string, maxSize: number): void {
  const codeSize = Buffer.byteLength(code, 'utf-8');
  if (codeSize > maxSize) {
    throw new Error(`Code size (${codeSize} bytes) exceeds maximum allowed size (${maxSize} bytes)`);
  }
}

