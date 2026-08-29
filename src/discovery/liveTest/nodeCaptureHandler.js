// Discovery live-test node capture/save handler
// NOTE: exact original file path could not be confirmed (0 GitHub code-search hits
// for Discovery/IVR/node-save anchors in ksabai-gl/FSDKC this run). This is a
// best-known-path draft fix implementing RCA Cause 1 & Cause 2 remediation.
// A maintainer must verify/relocate this against the real repository structure.

const logger = require('../../shared/logger');
const { saveNode } = require('./nodeRepository');
const { extractPromptText } = require('./promptExtractor');

/**
 * Captures an IVR node's prompt text and DTMF input during a Discovery live
 * test run, and persists it. Previously, any failure in prompt-text
 * extraction was silently swallowed and replaced with the hardcoded
 * placeholder string "Menu discovered", masking real parsing failures.
 * Additionally, the DTMF value captured during the call was never wired
 * into the node-save payload.
 *
 * Fixed behavior:
 *  - Extraction failures (or empty results) are logged and explicitly
 *    flagged via `prompt_extraction_status` / `needs_manual_review` instead
 *    of being silently replaced with a fallback string.
 *  - The DTMF value captured during the live-test call session is attached
 *    to the node-save payload so it is no longer dropped.
 *
 * @param {object} callSession - live-test call session context
 * @param {string} callSession.nodeId
 * @param {string} [callSession.dtmf]
 * @param {string} [callSession.lastCapturedDtmf]
 */
async function captureNode(callSession) {
  let promptText;
  let extractionError = null;

  try {
    promptText = await extractPromptText(callSession);
    if (!promptText || !promptText.trim()) {
      throw new Error('Prompt extraction returned empty result');
    }
  } catch (err) {
    extractionError = err;
    logger.error(
      `[Discovery] Prompt extraction failed for node ${callSession.nodeId}: ${err.message}`
    );
  }

  // Fix for RCA Cause 2: previously the DTMF value captured mid-call was
  // never read here, so it never reached the persisted node payload.
  const dtmfValue = callSession.dtmf ?? callSession.lastCapturedDtmf ?? null;

  const node = {
    id: callSession.nodeId,
    // Fix for RCA Cause 1: never persist the hardcoded "Menu discovered"
    // placeholder on failure. Persist null and flag for manual review
    // instead of masking the failure with fake content.
    prompt_text: extractionError ? null : promptText,
    prompt_extraction_status: extractionError ? 'failed' : 'success',
    dtmf_value: dtmfValue,
    needs_manual_review: Boolean(extractionError)
  };

  return saveNode(node);
}

module.exports = { captureNode };
