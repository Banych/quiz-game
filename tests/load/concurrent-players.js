import http from 'k6/http';
import { check, sleep } from 'k6';
import { config, generatePlayerName } from './config.js';

// Test options
export const options = {
  stages: config.stages.playerJoins,
  thresholds: {
    'http_req_duration{operation:join}': config.thresholds.playerJoin,
    http_req_failed: ['rate<0.01'],
  },
  setupTimeout: '30s', // Quick setup - just verifying quiz exists
};

// Test setup: Verify quiz exists
export function setup() {
  const quizId = config.quizId;
  if (quizId === 'UPDATE_ME') {
    throw new Error('Please update QUIZ_ID in config.js');
  }

  // Verify quiz exists
  const quizRes = http.get(`${config.baseUrl}/api/quiz/${quizId}/state`);
  if (quizRes.status !== 200) {
    throw new Error(`Quiz ${quizId} not found`);
  }

  const quiz = JSON.parse(quizRes.body);
  console.log(`✓ Using quiz: ${quiz.title}`);

  return { quizId };
}

// Main test scenario: Concurrent player joins
export default function (data) {
  const { quizId } = data;
  const playerName = generatePlayerName('ConcurrentTest');

  // Join quiz
  const joinRes = http.post(
    `${config.baseUrl}/api/player/add`,
    JSON.stringify({ quizId, playerName }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { operation: 'join' },
    }
  );

  // Verify join succeeded
  check(joinRes, {
    'join status is 200': (r) => r.status === 200,
    'join has player id': (r) => {
      const body = JSON.parse(r.body);
      return body.player && body.player.id;
    },
  });

  if (joinRes.status !== 200) {
    console.error(`Join failed: ${joinRes.status} - ${joinRes.body}`);
    return;
  }

  // Extract player ID
  const { player } = JSON.parse(joinRes.body);
  const playerId = player.id;

  // Verify session created
  const sessionRes = http.get(
    `${config.baseUrl}/api/quiz/${quizId}/player/${playerId}`
  );

  check(sessionRes, {
    'session status is 200': (r) => r.status === 200,
    'session has player data': (r) => {
      const body = JSON.parse(r.body);
      return body.player && body.player.id === playerId;
    },
  });

  sleep(1);
}

// Test teardown
export function teardown(data) {
  console.log('\n=== Concurrent Player Join Test Complete ===');
  console.log(`Quiz ID: ${data.quizId}`);
}
