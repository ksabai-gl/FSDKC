/**
 * Discovery live-test IVR node capture service.
 *
 * NOTE: Best-known path for the Discovery live-test node-save/capture handler.
 * GitHub code-search returned 0 hits for this repo against the RCA anchors
 * (discovery live-test, node save, prompt extraction, "Menu discovered").
 * If the real handler lives elsewhere, relocate this fix accordingly before merge.
 */

const logger = require('../../lib/logger');
const { extractPromptText } = require('./promptExtractor');
const { saveDiscoveryNode } = require('./discoveryRepository');

/**
 * Captures a single IVR node during a Discovery live test.
 *
 * Fixes SCRUM-89:
 *  - No longer persists the hardcoded placeholder "Menu discovered" when
 *    prompt-text extraction fails or times out. Failures are now surfaced
 *    explicitly (logged + rethrown) instead of masked as successful captures.
 *  - Wires the DTMF value captured during the live-test session into the
 *    node-save payload, closing the gap where DTMF input was collected but
 *    never persisted alongside the node.
 *
 * @param {object} callSession - Active live-test call session.
 * @param {string} callSession.id - Unique call/session identifier.
 * @param {string} callSession.currentNodeId - IVR node currently being tested.
 * @param {string|number|null} [callSession.lastDtmfInput] - DTMF digit(s) captured during this step.
 * @returns {Promise<object>} The saved Discovery node record.
 * @throws {Error} When prompt-text extraction fails or returns empty content.
 */
async function captureIvrNode(callSession) {
  let promptText;
  let captureError = null;

  try {
    promptText = await extractPromptText(callSession);
  } catch (err) {
    captureError = err;
  }

  if (!captureError && (!promptText || !promptText.trim())) {
    captureError = new Error(
      `Prompt extraction returned empty result for node ${callSession.currentNodeId}`
    );
  }

  const node = {
    nodeId: callSession.currentNodeId,
    promptText: captureError ? null : promptText,
    dtmf: callSession.lastDtmfInput ?? null,
    captureStatus: captureError ? 'FAILED' : 'OK',
    captureError: captureError ? captureError.message : null,
    capturedAt: new Date().toISOString(),
  };

  if (captureError) {
    logger.error('IVR prompt capture failed', {
      nodeId: node.nodeId,
      callId: callSession.id,
      error: captureError.message,
    });
  }

  await saveDiscoveryNode(node);

  if (captureError) {
    // Let the live-test orchestrator retry or mark this node as needs-review
    // instead of silently treating a failed capture as a successful one.
    throw captureError;
  }

  return node;
}

module.exports = {
  captureIvrNode,
};
