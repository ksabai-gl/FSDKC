export function getSeedDocuments() {
  const now = new Date();

  return {
    transcripts: [
      {
        module: 'discovery',
        reference_id: 1,
        payload: {
          event: 'ivr_traversal_started',
          phone_number: '+18005551234',
          transcript: 'Welcome to Acme Bank. Press 1 for accounts, 2 for loans.',
          language: 'en',
          confidence: 0.97,
        },
        created_at: new Date(now - 7200000),
      },
      {
        module: 'discovery',
        reference_id: 1,
        payload: {
          event: 'dtmf_detected',
          dtmf: '1',
          transcript: 'You selected accounts. Press 1 for balance.',
          confidence: 0.99,
        },
        created_at: new Date(now - 7100000),
      },
      {
        module: 'discovery',
        reference_id: 2,
        payload: {
          event: 'speech_menu_discovery',
          transcript: 'For healthcare appointments press 2. For prescriptions press 3.',
          language: 'en-GB',
          confidence: 0.94,
        },
        created_at: new Date(now - 3600000),
      },
      {
        module: 'connect',
        reference_id: 2,
        payload: {
          event: 'reachability_check_failed',
          toll_free_number: '180018001800',
          country: 'IN',
          carrier: 'Airtel',
          failure_reason: 'Carrier routing failure',
        },
        created_at: new Date(now - 600000),
      },
      {
        module: 'connect',
        reference_id: 1,
        payload: {
          event: 'reachability_check_passed',
          toll_free_number: '18005559999',
          latency_ms: 245,
          mos_score: 4.2,
          carrier_route: 'US-East -> Verizon SIP',
        },
        created_at: new Date(now - 300000),
      },
      {
        module: 'connect',
        reference_id: 3,
        payload: {
          event: 'reachability_check_passed',
          toll_free_number: '08001234567',
          country: 'BR',
          carrier: 'Vivo',
          latency_ms: 380,
          mos_score: 4.0,
        },
        created_at: new Date(now - 120000),
      },
    ],
    diagnostics: [
      {
        module: 'discovery',
        reference_id: 1,
        mos_score: 4.1,
        latency_ms: 120,
        packet_loss_pct: 0.0,
        jitter_ms: 8,
        silence_duration_ms: 450,
        created_at: new Date(now - 7000000),
      },
      {
        module: 'discovery',
        reference_id: 2,
        mos_score: 3.9,
        latency_ms: 145,
        packet_loss_pct: 0.1,
        jitter_ms: 12,
        created_at: new Date(now - 3500000),
      },
      {
        module: 'connect',
        reference_id: 2,
        mos_score: 2.8,
        latency_ms: 890,
        packet_loss_pct: 3.2,
        jitter_ms: 45,
        regional_failure: 'Mumbai',
        created_at: new Date(now - 500000),
      },
      {
        module: 'connect',
        reference_id: 1,
        mos_score: 4.3,
        latency_ms: 245,
        packet_loss_pct: 0.0,
        jitter_ms: 6,
        created_at: new Date(now - 250000),
      },
    ],
  };
}
