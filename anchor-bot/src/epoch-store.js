const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('./logger');

const defaultEpochFilePath = path.join(__dirname, '../logs/height-epoch-map.jsonl');
const defaultBabylonAnchorFilePath = path.join(__dirname, '../logs/babylon-anchor-receipts.jsonl');
const defaultBabylonPendingFilePath = path.join(__dirname, '../logs/babylon-pending-submits.jsonl');
const API_BASE_URL = process.env.API_BASE_URL || '';

async function postToApi(endpoint, data) {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await axios.post(url, data);
        logger.info(`✅ API request succeeded [${endpoint}] (status ${response.status})`);
        return true;
    } catch (error) {
        logger.error(`❌ API request failed [${endpoint}]: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

function getEpochFilePath() {
    const configuredPath = process.env.HEIGHT_EPOCH_FILE;

    if (!configuredPath) {
        return defaultEpochFilePath;
    }

    if (path.isAbsolute(configuredPath)) {
        return configuredPath;
    }

    return path.resolve(process.cwd(), configuredPath);
}

function getBabylonAnchorFilePath() {
    const configuredPath = process.env.BABYLON_ANCHOR_FILE;

    if (!configuredPath) {
        return defaultBabylonAnchorFilePath;
    }

    if (path.isAbsolute(configuredPath)) {
        return configuredPath;
    }

    return path.resolve(process.cwd(), configuredPath);
}

function getBabylonPendingFilePath() {
    const configuredPath = process.env.BABYLON_PENDING_FILE;

    if (!configuredPath) {
        return defaultBabylonPendingFilePath;
    }

    if (path.isAbsolute(configuredPath)) {
        return configuredPath;
    }

    return path.resolve(process.cwd(), configuredPath);
}

function ensureStoreDir(filePath) {
    const storeDir = path.dirname(filePath);
    fs.mkdirSync(storeDir, { recursive: true });
}

function toBatchId(epoch) {
    return `batch-epoch-${epoch}`;
}

function getNextEpoch() {
    const filePath = getEpochFilePath();

    ensureStoreDir(filePath);

    if (!fs.existsSync(filePath)) {
        return 1;
    }

    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (!content) {
        return 1;
    }

    let maxEpoch = 0;
    const lines = content.split('\n');

    for (const line of lines) {
        if (!line.trim()) {
            continue;
        }

        try {
            const parsed = JSON.parse(line);
            if (typeof parsed.batch === 'number' && parsed.batch > maxEpoch) {
                maxEpoch = parsed.batch;
            }
        } catch (error) {
            logger.warn(`⚠️ Skipping invalid line in height-epoch store: ${line}`);
        }
    }

    return maxEpoch + 1;
}

function persistBatchEpoch(epoch, batch) {
    const filePath = getEpochFilePath();
    ensureStoreDir(filePath);

    const savedAt = new Date().toISOString();
    const batchId = toBatchId(epoch);
    const lines = batch
        .map((block) => JSON.stringify({
            epoch,
            batchId,
            height: block.height,
            hash: block.hash,
            savedAt,
        }))
        .join('\n');

    try {
        fs.appendFileSync(filePath, `${lines}\n`);
        return true;
    } catch (error) {
        logger.error(`❌ Unable to write height-epoch store: ${error.message}`);
        return false;
    }
}

async function persistHeightEpoch(epoch, block, indexInEpoch, epochCount) {
    const filePath = getEpochFilePath();
    ensureStoreDir(filePath);
    // const batch = epoch;
    // const batchCount = epochCount;
    // const indexInBatch = indexInEpoch;

    const line = JSON.stringify({
        batch: epoch,
        batchCount: epochCount,
        indexInBatch: indexInEpoch,
        height: block.height,
        hash: block.hash,
        savedAt: new Date().toISOString(),
    });

    try {
        fs.appendFileSync(filePath, `${line}\n`);
    } catch (error) {
        logger.error(`❌ Unable to write height-epoch store: ${error.message}`);
    }

    await postToApi('/batch/batch-height', line);

    return true;
}

async function persistBabylonAnchor(epoch, anchorResult) {
    const filePath = getBabylonAnchorFilePath();
    ensureStoreDir(filePath);
    // const batchId = toBatchId(epoch);

    const line = JSON.stringify({
        // epoch,
        batch: epoch,
        state: 'successfully',
        txHash: anchorResult.txHash,
        merkleRoot: anchorResult.merkleRoot,
        leafCount: anchorResult.leafCount,
        payload: anchorResult.memoPayload,
        startHeight: anchorResult.startHeight,
        endHeight: anchorResult.endHeight,
        engramHeights: anchorResult.engramHeights,
        savedAt: new Date().toISOString(),
    });

    try {
        fs.appendFileSync(filePath, `${line}\n`);
    } catch (error) {
        logger.error(`❌ Unable to write babylon anchor store: ${error.message}`);
    }

    await postToApi('/batch/batch-information', line);

    return true;
}

function persistBabylonPending(epoch, batch) {
    const filePath = getBabylonPendingFilePath();
    ensureStoreDir(filePath);

    const engramHeights = batch.map((item) => item.height);
    const startHeight = engramHeights[0];
    const endHeight = engramHeights[engramHeights.length - 1];
    const batchId = toBatchId(epoch);

    const line = JSON.stringify({
        // epoch,
        // batchId,
        batch: epoch,
        state: 'pending_submit',
        startHeight,
        endHeight,
        leafCount: batch.length,
        engramHeights,
        savedAt: new Date().toISOString(),
    });

    try {
        fs.appendFileSync(filePath, `${line}\n`);
        return true;
    } catch (error) {
        logger.error(`❌ Unable to write babylon pending store: ${error.message}`);
        return false;
    }
}

module.exports = {
    getEpochFilePath,
    getBabylonAnchorFilePath,
    getBabylonPendingFilePath,
    getNextEpoch,
    toBatchId,
    persistHeightEpoch,
    // persistBatchEpoch,
    persistBabylonPending,
    persistBabylonAnchor,
};
