import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const LICENSE_HEADER_PATH = path.resolve(ROOT_DIR, 'licenseheader.txt');
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css'];
const EXCLUDE_DIRS = ['node_modules', 'dist', '.git', 'brain', '.agent'];

const licenseHeader = fs.readFileSync(LICENSE_HEADER_PATH, 'utf8').trim() + '\n\n';

function shouldProcessFile(filePath) {
    const ext = path.extname(filePath);
    return EXTENSIONS.includes(ext);
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!EXCLUDE_DIRS.includes(file)) {
                processDirectory(fullPath);
            }
        } else if (shouldProcessFile(fullPath)) {
            addHeaderToFile(fullPath);
        }
    }
}

function addHeaderToFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check if header already exists
    if (content.includes('Copyright 2026 Orkes, Inc.')) {
        console.log(`Skipping: ${filePath} (Header already present)`);
        return;
    }

    console.log(`Adding header to: ${filePath}`);
    const newContent = licenseHeader + content;
    fs.writeFileSync(filePath, newContent, 'utf8');
}

console.log('Starting license header application...');
processDirectory(ROOT_DIR);
console.log('Finished!');
