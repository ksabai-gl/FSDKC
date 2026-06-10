db = db.getSiblingDB('klearcom');

db.transcripts.insertMany([
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
    created_at: new Date(),
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
    created_at: new Date(),
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
    created_at: new Date(),
  },
]);

db.call_diagnostics.insertMany([
  {
    module: 'discovery',
    reference_id: 1,
    mos_score: 4.1,
    latency_ms: 120,
    packet_loss_pct: 0.0,
    jitter_ms: 8,
    created_at: new Date(),
  },
  {
    module: 'connect',
    reference_id: 2,
    mos_score: 2.8,
    latency_ms: 890,
    packet_loss_pct: 3.2,
    jitter_ms: 45,
    regional_failure: 'Mumbai',
    created_at: new Date(),
  },
]);

db.test_events.createIndex({ session_id: 1, created_at: 1 });
db.transcripts.createIndex({ module: 1, reference_id: 1, created_at: -1 });

print('Klearcom MongoDB seeded');
