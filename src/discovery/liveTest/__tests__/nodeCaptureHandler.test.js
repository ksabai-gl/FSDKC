const { captureNode } = require('../nodeCaptureHandler');
const { saveNode } = require('../nodeRepository');
const { extractPromptText } = require('../promptExtractor');

jest.mock('../nodeRepository');
jest.mock('../promptExtractor');

describe('captureNode (SCRUM-89 regression)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    saveNode.mockImplementation((node) => Promise.resolve(node));
  });

  test('never persists the hardcoded "Menu discovered" placeholder on extraction failure', async () => {
    extractPromptText.mockRejectedValue(new Error('parse timeout'));

    const result = await captureNode({ nodeId: 'n1', dtmf: '1' });

    expect(result.prompt_text).not.toBe('Menu discovered');
    expect(result.prompt_text).toBeNull();
    expect(result.prompt_extraction_status).toBe('failed');
    expect(result.needs_manual_review).toBe(true);
  });

  test('flags empty extraction result as failure instead of persisting fallback text', async () => {
    extractPromptText.mockResolvedValue('   ');

    const result = await captureNode({ nodeId: 'n2' });

    expect(result.prompt_text).toBeNull();
    expect(result.prompt_extraction_status).toBe('failed');
    expect(result.needs_manual_review).toBe(true);
  });

  test('persists the real prompt text on successful extraction', async () => {
    extractPromptText.mockResolvedValue('Press 1 for sales, 2 for support');

    const result = await captureNode({ nodeId: 'n3', dtmf: '2' });

    expect(result.prompt_text).toBe('Press 1 for sales, 2 for support');
    expect(result.prompt_extraction_status).toBe('success');
    expect(result.needs_manual_review).toBe(false);
  });

  test('wires the DTMF value captured during the call into the saved node payload (RCA Cause 2)', async () => {
    extractPromptText.mockResolvedValue('Enter your account number');

    const result = await captureNode({ nodeId: 'n4', dtmf: '9' });

    expect(result.dtmf_value).toBe('9');
  });

  test('falls back to lastCapturedDtmf when dtmf is not directly present on the session', async () => {
    extractPromptText.mockResolvedValue('Enter your PIN');

    const result = await captureNode({ nodeId: 'n5', lastCapturedDtmf: '4' });

    expect(result.dtmf_value).toBe('4');
  });

  test('persists null dtmf_value when no DTMF was captured at all', async () => {
    extractPromptText.mockResolvedValue('Welcome menu');

    const result = await captureNode({ nodeId: 'n6' });

    expect(result.dtmf_value).toBeNull();
  });
});
"
      }
    }
  ]
}