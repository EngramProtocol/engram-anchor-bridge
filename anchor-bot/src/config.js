require('dotenv').config();

function getEnvInt(key, fallback) {
    const raw = process.env[key];
    if (!raw) {
        return fallback;
    }

    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
        return fallback;
    }

    return parsed;
}

const config = {
    STRATA_RPC: process.env.STRATA_RPC || '',
    BABYLON_RPC: process.env.BABYLON_RPC || '',
    BABYLON_DENOM: process.env.BABYLON_DENOM || '',
    BATCH_SIZE: getEnvInt('BATCH_SIZE', 200),
    POLL_INTERVAL_MS: getEnvInt('POLL_INTERVAL_MS', 0),
    BABYLON_MEMO_PREFIX: process.env.BABYLON_MEMO_PREFIX || '',
    MNEMONIC: process.env.BABYLON_MNEMONIC ? process.env.BABYLON_MNEMONIC.trim() : '',
};

module.exports = config;
