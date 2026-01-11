#!/usr/bin/env bun
import { parseArgs } from 'util';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { downloadFile } from './lib/download';
import { transformToRawData, transformToAppData } from './lib/transform';
import { calculateSHA256 } from './lib/download';
import type { ExtractedManufacturer } from './lib/transform';
import { extractManufacturersFromXlsx } from './lib/extract-xlsx';

const CACHE_DIR = '.cache';
const METADATA_PATH = join(CACHE_DIR, 'cache-metadata.json');
const RAW_DATA_DIR = 'data/raw';
const APP_DATA_DIR = 'src/data';

const XLSX_URL = 'https://echonet.jp/wp/wp-content/uploads/pdf/General/Echonet/ManufacturerCode/list_code.xlsx';
const XLSX_FILENAME = 'list_code.xlsx';

interface CliOptions {
  force: boolean;
  dryRun: boolean;
  verbose: boolean;
  help: boolean;
}

function printHelp(): void {
  console.log(`
Usage: ./scripts/fetch-data [OPTIONS]

Fetch and process ECHONET Lite manufacturer code data

OPTIONS:
  --force, -f       Force re-download (ignore cache)
  --dry-run         Skip download, use existing cache
  --verbose, -v     Verbose output
  --help, -h        Show this help message
`);
}

function createLogger(verboseMode: boolean) {
  return {
    info(message: string): void {
      console.log(message);
    },
    debug(message: string): void {
      if (verboseMode) {
        console.log(message);
      }
    },
  };
}


async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      force: { type: 'boolean', short: 'f', default: false },
      'dry-run': { type: 'boolean', default: false },
      verbose: { type: 'boolean', short: 'v', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });

  const options: CliOptions = {
    force: values.force || false,
    dryRun: values['dry-run'] || false,
    verbose: values.verbose || false,
    help: values.help || false,
  };

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const log = createLogger(options.verbose);

  try {
    // Create directories
    for (const dir of [CACHE_DIR, RAW_DATA_DIR, APP_DATA_DIR]) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }

    log.info('[1/3] Downloading data from ECHONET Consortium...');

    const xlsxPath = join(CACHE_DIR, XLSX_FILENAME);

    if (!options.dryRun) {
      log.debug(`  → Checking cache for ${XLSX_FILENAME}`);

      const downloadResult = await downloadFile({
        url: XLSX_URL,
        filename: XLSX_FILENAME,
        cacheDir: CACHE_DIR,
        metadataPath: METADATA_PATH,
        force: options.force,
      });

      if (downloadResult.status === 'cache-hit') {
        log.info('  ✓ Cache hit');
        if (downloadResult.error) {
          log.info(`  ⚠️  ${downloadResult.error}`);
        }
      } else if (downloadResult.status === 'downloaded') {
        const sizeMB = ((downloadResult.size || 0) / 1024 / 1024).toFixed(2);
        log.info(`  ✓ Downloaded ${XLSX_FILENAME} (${sizeMB} MB)`);
      } else {
        console.error(`  ✗ Download failed: ${downloadResult.error}`);
        process.exit(1);
      }
    } else {
      log.info('  → Skipping download (dry-run mode)');

      if (!existsSync(xlsxPath)) {
        console.error(`  ✗ Error: ${xlsxPath} not found. Cannot proceed in dry-run mode.`);
        process.exit(1);
      }
    }

    log.info('\n[2/3] Extracting data from XLSX...');

    log.debug('  → Running XLSX extractor...');
    const extractedData = await extractManufacturersFromXlsx(xlsxPath);

    log.info(`  ✓ Extracted ${extractedData.length} manufacturers`);

    // Save extracted data to cache for debugging
    const extractedJsonPath = join(CACHE_DIR, 'extracted.json');
    await Bun.write(extractedJsonPath, JSON.stringify(extractedData, null, 2));

    // Calculate XLSX hash
    const xlsxBuffer = await Bun.file(xlsxPath).arrayBuffer();
    const xlsxHash = calculateSHA256(Buffer.from(xlsxBuffer));

    // Transform to raw format
    const rawData = await transformToRawData(extractedData, {
      source: XLSX_URL,
      sourceFileHash: xlsxHash,
    });

    const rawDataPath = join(RAW_DATA_DIR, 'manufacturers.json');
    await Bun.write(rawDataPath, JSON.stringify(rawData, null, 2));

    log.info(`  ✓ Saved to ${rawDataPath}`);

    log.info('\n[3/3] Converting to application format...');

    log.debug(`  → Validating ${rawData.manufacturers.length} records`);

    const appData = transformToAppData(rawData);

    const appDataPath = join(APP_DATA_DIR, 'manufacturers.json');
    await Bun.write(appDataPath, JSON.stringify(appData, null, 2));

    const appDataSize = (await Bun.file(appDataPath).size / 1024).toFixed(1);
    log.info(`  ✓ Generated ${appDataPath} (${appDataSize} KB)`);

    log.info('\n✨ Done! Ready for deployment.');
    process.exit(0);
  } catch (error) {
    console.error(`\n✗ Error: ${error}`);
    process.exit(1);
  }
}

main();
