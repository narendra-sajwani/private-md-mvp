// services/secretLLMService.js - Integration with Nillion's SecretLLM

const { SecretLLMTaskBuilder } = require('@nillionnetwork/nillion-sdk');
const { getNillionClient } = require('../config/nillion');
const logger = require('../config/logger');

class SecretLLMService {
  /**
   * Process a medical consultation through SecretLLM
   * 
   * @param {string} patientQuery - The patient's medical question
   * @param {Object} patientContext - Patient information like age, history, etc.
   * @returns {Promise<string>} - The AI doctor's response
   */
  async processMedicalConsultation(patientQuery, patientContext = {}) {
    try {
      // Get the Nillion client
      const nillionClient = await getNillionClient();
      
      // Create a SecretLLM task builder
      const taskBuilder = new SecretLLMTaskBuilder();
      
      // Create a system prompt for medical consultation
      const systemPrompt = this._createMedicalSystemPrompt(patientContext);
      
      // Configure the task
      taskBuilder
        .withSystemPrompt(systemPrompt)
        .withUserPrompt(patientQuery)
        .withModel(process.env.LLM_MODEL || 'gpt-4')
        .withTemperature(0.3) // Lower temperature for more conservative medical advice
        .withMaxTokens(1000);
      
      // Build and execute the task
      const task = taskBuilder.build();
      logger.debug('Executing SecretLLM task for medical consultation');
      
      const result = await nillionClient.executeSecretLLMTask(task);
      logger.debug('SecretLLM task executed successfully');
      
      return result.response;
    } catch (error) {
      logger.error('Error in medical consultation:', error);
      throw new Error('Medical consultation processing failed');
    }
  }
  
  /**
   * Store consultation data securely in Nillion's network
   * 
   * @param {string} userId - The user's ID
   * @param {Object} consultation - Consultation data to store
   * @returns {Promise<string>} - Storage ID for the consultation
   */
  async storeConsultation(userId, consultation) {
    try {
      const nillionClient = await getNillionClient();
      
      // Prepare data for storage
      const storageData = {
        userId,
        timestamp: Date.now(),
        patientQuery: consultation.query,
        aiResponse: consultation.response,
        metadata: consultation.metadata || {}
      };
      
      // Encrypt and store the consultation
      logger.debug('Encrypting consultation data for storage');
      const encryptedData = await nillionClient.encrypt(storageData);
      
      logger.debug('Storing encrypted consultation in Nillion network');
      const storageId = await nillionClient.store(encryptedData);
      
      return storageId;
    } catch (error) {
      logger.error('Error storing consultation:', error);
      throw new Error('Failed to securely store consultation');
    }
  }
  
  /**
   * Retrieve a stored consultation from Nillion's network
   * 
   * @param {string} userId - The user's ID
   * @param {string} storageId - The consultation storage ID
   * @returns {Promise<Object>} - The decrypted consultation
   */
  async retrieveConsultation(userId, storageId) {
    try {
      const nillionClient = await getNillionClient();
      
      logger.debug(`Retrieving consultation with ID: ${storageId}`);
      const encryptedConsultation = await nillionClient.retrieve(storageId);
      
      logger.debug('Decrypting consultation data');
      const decryptedConsultation = await nillionClient.decrypt(encryptedConsultation);
      
      // Verify the user has permission to access this consultation
      if (decryptedConsultation.userId !== userId) {
        logger.warn(`Unauthorized attempt to access consultation: ${storageId} by user: ${userId}`);
        throw new Error('Unauthorized access to consultation');
      }
      
      return decryptedConsultation;
    } catch (error) {
      logger.error('Error retrieving consultation:', error);
      throw new Error('Failed to retrieve consultation');
    }
  }
  
  /**
   * Create a system prompt for the medical AI
   * 
   * @private
   * @param {Object} patientContext - Patient information
   * @returns {string} - The system prompt
   */
  _createMedicalSystemPrompt(patientContext) {
    // Format patient context for the prompt
    const contextStr = Object.entries(patientContext)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${this._formatKey(key)}: ${value}`)
      .join('\n');
    
    return `
      You are a compassionate medical AI assistant providing consultations to patients.
      Your role is to offer helpful information based on the patient's symptoms and concerns.
      
      IMPORTANT GUIDELINES:
      - Be clear about your limitations as an AI and when a patient should seek in-person medical care.
      - Never make definitive diagnoses. Instead, suggest possibilities and next steps.
      - Always prioritize patient safety in your recommendations.
      - Encourage appropriate follow-up with healthcare providers.
      - For emergencies, always advise seeking immediate medical attention.
      - Use plain, accessible language when explaining medical concepts.
      - Be respectful, empathetic, and professional in your responses.
      
      PATIENT INFORMATION:
      ${contextStr || "No additional patient information provided."}
    `.trim();
  }
  
  /**
   * Format the context key for better readability
   * 
   * @private
   * @param {string} key - The context key
   * @returns {string} - Formatted key
   */
  _formatKey(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/([a-z])([A-Z])/g, '$1 $2');
  }
}

// Export as singleton
module.exports = new SecretLLMService();