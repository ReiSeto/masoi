/**
 * Full Game Test — Simulates 4 players (1 host + 3 bots) playing a complete game
 * 
 * This script:
 * 1. Creates a room via API (as host)
 * 2. Connects all 4 players via Socket.IO
 * 3. All players join the room
 * 4. Host starts the game
 * 5. All players auto-play through Night/Dawn/Discuss/Vote cycles
 * 6. Game runs until a win condition is met
 * 
 * Usage: node test/full-game-test.js
 */
const io = require('socket.io-client');

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api/v1';

const PLAYERS = [
  { email: 'test1@game.com', password: 'test123456', isHost: true },
  { email: 'bot2@test.com', password: 'test123456' },
  { email: 'bot3@test.com', password: 'test123456' },
  { email: 'bot4@test.com', password: 'test123456' },
];

let ROOM_CODE = '';
let GAME_ID = '';
let connectedPlayers = [];
let lobbyReady = 0;
let gameStarted = false;

// ============================================================
// HELPERS
// ============================================================

async function loginPlayer(player) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: player.email, password: player.password }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(`Login failed for ${player.email}: ${data.message}`);
  return { token: data.data.access_token, user: data.data.user };
}

async function createRoom(token) {
  const res = await fetch(`${API_URL}/games/rooms`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ max_players: 12 }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(`Create room failed: ${data.message}`);
  return data.data.game;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ============================================================
// CONNECT A PLAYER
// ============================================================

function connectPlayer(playerInfo, index) {
  return new Promise(async (resolve, reject) => {
    try {
      const { token, user } = await loginPlayer(playerInfo);
      const label = playerInfo.isHost ? `🎯 HOST ${user.username}` : `🤖 Bot${index} ${user.username}`;
      console.log(`${label}: logged in (id: ${user.id.slice(0,8)}...)`);

      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false,
      });

      const playerData = { socket, user, token, label, role: null, isAlive: true };

      socket.on('connect', () => {
        console.log(`${label}: socket connected`);
      });

      socket.on('connected', () => {
        // Wait then join lobby
        setTimeout(() => {
          console.log(`${label}: joining room ${ROOM_CODE}...`);
          socket.emit('lobby:join', { room_code: ROOM_CODE });
        }, 300);
      });

      socket.on('lobby:joined', (data) => {
        console.log(`${label}: ✅ joined room ${data.room_code}`);
      });

      socket.on('lobby:updated', (data) => {
        const count = data.players?.length || 0;
        console.log(`${label}: lobby updated — ${count} players in room`);
        
        // Host auto-starts when 4 players are in the room
        if (count >= 4 && playerInfo.isHost && !gameStarted) {
          gameStarted = true; // Prevent double-start
          setTimeout(() => {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`🎮 HOST starting game! (${count} players ready)`);
            console.log(`${'='.repeat(60)}\n`);
            socket.emit('lobby:start');
          }, 1500);
        }
      });

      socket.on('error', (err) => {
        console.error(`${label}: ❌ ERROR: ${err.message || JSON.stringify(err)}`);
      });

      // ============================================
      // GAME EVENTS
      // ============================================
      
      socket.on('lobby:countdown', ({ seconds }) => {
        console.log(`${label}: ⏱️ Game starts in ${seconds}s`);
      });

      socket.on('game:init', (data) => {
        gameStarted = true;
        console.log(`${label}: 🎮 Game initialized! ${data.players.length} players`);
      });

      socket.on('game:role_assigned', (data) => {
        playerData.role = data.role;
        const teamEmoji = data.role.team === 'werewolf' ? '🐺' : data.role.team === 'village' ? '🏘️' : '🃏';
        console.log(`${label}: 🎭 Role = ${teamEmoji} ${data.role.slug} (${data.role.team}, aura: ${data.role.aura})`);
      });

      socket.on('game:wolf_team', (data) => {
        const wolves = data.wolves.map(w => w.username).join(', ');
        console.log(`${label}: 🐺 Wolf team: ${wolves}`);
      });

      socket.on('game:phase_change', (data) => {
        const phaseEmoji = { night: '🌙', dawn: '☀️', discuss: '💬', vote: '🗳️', ended: '🏁' };
        console.log(`\n${phaseEmoji[data.phase] || '📢'} Phase: ${data.phase.toUpperCase()} — Round ${data.round} (${data.duration}s)`);
        
        if (data.deaths?.length > 0) {
          data.deaths.forEach(d => console.log(`  💀 ${d.username} died (${d.cause})`));
        }
        if (data.events?.length > 0) {
          data.events.forEach(e => console.log(`  📋 ${e.content || e.message}`));
        }

        // Auto-vote during vote phase
        if (data.phase === 'vote' && data.voteTargets && playerData.isAlive) {
          const targets = data.voteTargets.filter(t => t.userId !== user.id);
          if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];
            setTimeout(() => {
              console.log(`${label}: 🗳️ voting for ${target.username}`);
              socket.emit('game:vote', { target_id: target.userId });
            }, Math.random() * 2000 + 500);
          }
        }
      });

      socket.on('game:night_action_prompt', (data) => {
        console.log(`${label}: 🌙 Night prompt — ${data.actionType || data.roleSlug}`);
        
        if (data.targets && data.targets.length > 0) {
          const target = data.targets[Math.floor(Math.random() * data.targets.length)];
          const actionType = data.actionType || 'wolf_kill';
          console.log(`${label}: → picks ${target.username} (${actionType})`);
          socket.emit('game:night_action', { action_type: actionType, target_id: target.userId });
        } else if (data.actions) {
          // Witch-style actions
          const firstAction = data.actions.find(a => a.targets && a.targets.length > 0);
          if (firstAction) {
            const target = firstAction.targets[Math.floor(Math.random() * firstAction.targets.length)];
            console.log(`${label}: → picks ${target.username} (${firstAction.type})`);
            socket.emit('game:night_action', { action_type: firstAction.type, target_id: target.userId });
          } else {
            const skipAction = data.actions.find(a => a.type === 'witch_skip');
            if (skipAction) {
              console.log(`${label}: → skips witch action`);
              socket.emit('game:night_action', { action_type: 'witch_skip', target_id: null });
            }
          }
        }
      });

      socket.on('game:action_confirmed', () => {
        console.log(`${label}: ✅ action confirmed`);
      });

      socket.on('game:vote_confirmed', () => {
        console.log(`${label}: ✅ vote confirmed`);
      });

      socket.on('game:vote_result', (data) => {
        if (data.votedOutPlayer) {
          console.log(`  ⚰️ ${data.votedOutPlayer.username} (${data.votedOutPlayer.roleSlug}) was voted out!`);
        }
        if (data.isTie) {
          console.log(`  ⚖️ Vote tied — nobody dies`);
        }
        if (data.events) {
          data.events.forEach(e => console.log(`  📋 ${e.content}`));
        }
      });

      socket.on('game:seer_result', (data) => {
        const auraEmoji = data.aura === 'good' ? '✅' : data.aura === 'evil' ? '❌' : '⚪';
        console.log(`${label}: 🔮 Seer result: ${data.targetUsername} = ${auraEmoji} ${data.aura}`);
      });

      socket.on('game:hunter_shot_prompt', (data) => {
        console.log(`${label}: 🏹 Hunter shot prompt!`);
        if (data.targets?.length > 0) {
          const target = data.targets[Math.floor(Math.random() * data.targets.length)];
          console.log(`${label}: → shoots ${target.username}`);
          socket.emit('game:hunter_shot', { target_id: target.userId });
        }
      });

      socket.on('game:hunter_shot_result', (data) => {
        console.log(`  🏹 ${data.hunterUsername} (Hunter) shot ${data.targetUsername}!`);
      });

      socket.on('game:ended', (data) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🏁 GAME OVER: ${data.reason}`);
        console.log(`${'='.repeat(60)}`);
        console.log(`\n🎭 Role Reveal:`);
        data.roleReveal.forEach(r => {
          const status = r.isAlive ? '✅ Alive' : '💀 Dead';
          const teamEmoji = r.team === 'werewolf' ? '🐺' : r.team === 'village' ? '🏘️' : '🃏';
          console.log(`  ${status} — ${r.username}: ${teamEmoji} ${r.roleSlug}`);
        });
        console.log(`\n✨ Winning Team: ${data.winningTeam}`);
        console.log(`${'='.repeat(60)}\n`);
        
        setTimeout(() => {
          console.log('🎉 Test completed successfully! Exiting...');
          process.exit(0);
        }, 3000);
      });

      socket.on('game:timer', () => { /* silent */ });

      resolve(playerData);
    } catch (err) {
      reject(err);
    }
  });
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🐺 WOLVESVILLE VN — Full Game Test`);
  console.log(`${'='.repeat(60)}\n`);

  // Step 1: Login host and create room
  console.log('📋 Step 1: Login host & create room...');
  const { token: hostToken } = await loginPlayer(PLAYERS[0]);
  const game = await createRoom(hostToken);
  ROOM_CODE = game.room_code;
  GAME_ID = game.id;
  console.log(`✅ Room created: ${ROOM_CODE} (ID: ${GAME_ID.slice(0,8)}...)\n`);

  // Step 2: Connect all players sequentially
  console.log('📋 Step 2: Connecting players...');
  for (let i = 0; i < PLAYERS.length; i++) {
    try {
      const p = await connectPlayer(PLAYERS[i], i + 1);
      connectedPlayers.push(p);
      await sleep(2500); // Stagger connections
    } catch (err) {
      console.error(`Failed to connect player ${i + 1}:`, err.message);
    }
  }

  console.log(`\n✅ ${connectedPlayers.length}/${PLAYERS.length} players connected`);
  console.log('⏳ Waiting for all players to join lobby and game to start...\n');

  // Timeout safety — kill after 5 minutes if game doesn't end
  setTimeout(() => {
    console.error('\n⏰ TIMEOUT: Game did not complete within 5 minutes!');
    process.exit(1);
  }, 5 * 60 * 1000);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
