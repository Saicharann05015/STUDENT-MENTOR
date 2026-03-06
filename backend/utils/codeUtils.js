/**
 * Utility functions for code preprocessing and manipulation.
 */

/**
 * Preprocesses code by removing unnecessary whitespace and empty lines 
 * to reduce token usage for AI prompts.
 * @param {string} code 
 * @returns {string}
 */
const cleanCode = (code) => {
    if (!code || typeof code !== 'string') return '';

    return code
        .split('\n')
        .map(line => line.trim()) // Trim each line
        .filter(line => line.length > 0) // Remove empty lines
        .join('\n') // Join back
        .replace(/\s{2,}/g, ' '); // Collapse multiple spaces into one
};

module.exports = { cleanCode };
