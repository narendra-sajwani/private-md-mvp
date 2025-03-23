// config/nillion.js - Nillion configuration and client setup

const { NillionClient } = require('@nillionnetwork/nillion-sdk');
const logger = require('./logger');

// Nillion client configuration
const nillionConfig = {
  apiKey: process.env.NILLION_API_KEY,
  endpoint: process.env.NILLION_ENDPOINT,
  networkId: process.env.NILLION_NETWORK_ID
};

// Create singleton instance of Nillion client
let nillionClient = null;

/**
 * Initialize the Nillion client
 * @returns {Promise<NillionClient>} The initialized Nillion client
 */
const initializeNillionClient = async () => {
  try {
    if (!nillionClient) {
      nillionClient = new NillionClient(nillionConfig);
      await nillionClient.connect();
      logger.info('Nillion client initialized successfully');
    }
    return nillionClient;
  } catch (error) {
    logger.error('Failed to initialize Nillion client:', error);
    throw new Error('Nillion service initialization failed');
  }
};

/**
 * Get the Nillion client instance, initializing if necessary
 * @returns {Promise<NillionClient>} The Nillion client
 */
const getNillionClient = async () => {
  if (!nillionClient) {
    return await initializeNillionClient();
  }
  return nillionClient;
};

module.exports = {
  initializeNillionClient,
  getNillionClient,
  nillionConfig
};