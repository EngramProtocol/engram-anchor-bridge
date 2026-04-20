const config = require('./config');
const logger = require('./logger');
const { getStrataBlock } = require('./strata');
const { anchorBatch } = require('./merkle');
const {
    getEpochFilePath,
    getBabylonAnchorFilePath,
    getBabylonPendingFilePath,
    getNextEpoch,
    persistHeightEpoch,
    persistBabylonPending,
    persistBabylonAnchor,
} = require('./epoch-store');

function validateRuntimeConfig() {
    if (!config.MNEMONIC) {
        logger.error('❌ Missing BABYLON_MNEMONIC environment variable.');
        process.exit(1);
    }
}

async function main() {
    validateRuntimeConfig();

    logger.info('🤖 Starting Engram to Babylon batcher');
    logger.info(`👉 Batch Size: ${config.BATCH_SIZE} | RPC: ${config.BABYLON_RPC}`);
    logger.info('⏳ Watching Strata for new blocks');
    logger.info(`🗂️ Epoch-Batch Store: ${getEpochFilePath()}`);
    logger.info(`🗂️ Babylon Anchor Store: ${getBabylonAnchorFilePath()}`);
    logger.info(`🗂️ Babylon Pending Store: ${getBabylonPendingFilePath()}`);

    let lastProcessedHeight = 0;
    let batchBuffer = [];
    let currentEpoch = getNextEpoch();
    let pendingRecordedForEpoch = false;

    while (true) {
        const block = await getStrataBlock();

        if (block && block.height > lastProcessedHeight) {
            const exists = batchBuffer.find((item) => item.height === block.height);

            if (!exists) {
                batchBuffer.push(block);
                const indexInEpoch = batchBuffer.length;
                logger.info(`📥 Collected block ${block.height} hash ${block.hash.substring(0, 10)}... (index ${indexInEpoch}/${config.BATCH_SIZE}, epoch ${currentEpoch})`);

                const stored = await persistHeightEpoch(currentEpoch, block, indexInEpoch, config.BATCH_SIZE);
                if (stored) {
                    logger.info(`🧾 Saved epoch-to-batch mapping (epoch ${currentEpoch}, height ${block.height}, index ${indexInEpoch}/${config.BATCH_SIZE})`);
                }

                lastProcessedHeight = block.height;

                if (batchBuffer.length >= config.BATCH_SIZE) {
                    if (!pendingRecordedForEpoch) {
                        const pendingStored = persistBabylonPending(currentEpoch, batchBuffer);
                        if (pendingStored) {
                            logger.info(`🕒 Saved pending submission (epoch ${currentEpoch}, ${batchBuffer.length} heights)`);
                            pendingRecordedForEpoch = true;
                        }
                    }

                    const anchorResult = await anchorBatch(batchBuffer);
                    if (anchorResult) {
                        const anchorStored = await persistBabylonAnchor(currentEpoch, anchorResult);
                        if (anchorStored) {
                            logger.info(`🧾 Saved anchor record (epoch ${currentEpoch}, tx ${anchorResult.txHash}, root ${anchorResult.merkleRoot.substring(0, 12)}...)`);
                        }

                        logger.info(`✅ Completed epoch ${currentEpoch} (${batchBuffer.length}/${config.BATCH_SIZE})`);
                        currentEpoch += 1;
                        batchBuffer = [];
                        pendingRecordedForEpoch = false;
                    } else {
                        logger.info('⚠️ Submission failed, retrying next cycle');
                    }
                }
            }
        }

        await new Promise((resolve) => setTimeout(resolve, config.POLL_INTERVAL_MS));
    }
}

module.exports = {
    main,
};
