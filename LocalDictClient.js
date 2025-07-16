/**
 * @file LocalDictdClient.js
 * @description This script provides a client for a local dictd server,
 * accessed via an HTTP proxy, for use with a Chrome extension
 * that supports custom dictionary scripts.
 *
 * Assumes an HTTP proxy for dictd is running on localhost:8000.
 * (e.g., a Python Flask or Node.js Express server)
 * Example proxy URL: http://localhost:8000/define?word={your-word}
 */

// Important: Use a unique and descriptive class name to avoid conflicts
// The naming convention suggested is 'sourceLanguageTargetLanguage_DictionaryName'
// For a local dictd, we'll use 'en_LocalDictd' as an example, assuming English dictionaries.
class en_LocalDictdClient {
    /**
     * @constructor
     * Initializes the client. No specific setup needed here for a simple HTTP call,
     * but you could add configuration options (like proxy URL) if the extension
     * provides a way to pass them.
     */
    constructor() {
        // The base URL for your local dictd HTTP proxy.
        // Make sure this matches the port your proxy is listening on.
        this.proxyBaseUrl = 'http://localhost:8000/define';
        console.log("Local Dictd Client initialized. Proxy URL:", this.proxyBaseUrl);
    }

    /**
     * @method findTerm
     * Looks up a word using the local dictd HTTP proxy.
     * @param {string} word The word to look up.
     * @returns {Promise<string>} A Promise that resolves with the definition
     * content (HTML or plain text) or rejects with an error.
     */
    findTerm(word) {
        return new Promise(async (resolve, reject) => {
            if (!word || word.trim() === '') {
                reject(new Error("No word provided for lookup."));
                return;
            }

            const encodedWord = encodeURIComponent(word.trim());
            const lookupUrl = `${this.proxyBaseUrl}?word=${encodedWord}`;

            try {
                console.log(`Attempting to fetch definition for: "${word}" from ${lookupUrl}`);
                const response = await fetch(lookupUrl);

                if (!response.ok) {
                    // If the HTTP response status is not 2xx
                    const errorText = await response.text(); // Get raw error response
                    console.error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
                    reject(new Error(`Failed to fetch definition: Server responded with status ${response.status}.`));
                    return;
                }

                const data = await response.json(); // Assuming your proxy returns JSON

                // Check if the JSON response contains the definition
                if (data && data.definition) {
                    console.log(`Definition found for "${word}":`, data.definition.substring(0, 100) + "..."); // Log first 100 chars
                    // Resolve the promise with the definition content.
                    // The extension will likely display this directly.
                    resolve(`<pre>${data.definition}</pre>`); // Using <pre> for pre-formatted text from dictd
                } else {
                    console.warn(`No definition or unexpected data structure for "${word}":`, data);
                    reject(new Error(`No definition found for "${word}" or unexpected response format.`));
                }

            } catch (error) {
                // Handle network errors, JSON parsing errors, etc.
                console.error(`Error during dictd lookup for "${word}":`, error);
                if (error.message.includes("Failed to fetch")) {
                    reject(new Error(`Could not connect to local dictd proxy at ${this.proxyBaseUrl}. Is it running? (${error.message})`));
                } else {
                    reject(new Error(`An error occurred during dictionary lookup: ${error.message}`));
                }
            }
        });
    }
}

// Important: The extension's guide implies that you need to make your class available
// in the global scope or in a way it can discover it.
// Assuming the extension scans for classes in the global scope,
// you might need to ensure this script is loaded correctly by the extension.
// No explicit export is typically needed if the extension directly evaluates the script content.


