/**
 * Bot players for testing — Simulates 3 bots joining a room and playing
 * 
 * Usage: node test/bot-players.js <ROOM_CODE>
 */
const io = require('socket.io-client');

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api/v1';

const BOTS = [
  { email: 'bot2@test.com', password: 'test123456' },
  { email: 'bot3@test.com', password: 'test123456' },
  { email: 'bot4@test.com', password: 'test123456' },
];

const ROOM_CODE = process.argv[2];
if (!ROOM_CODE) {
  console.log('Usage: node test/bot-players.js <ROOM_CODE>');
  process.exit(1);
}

async function loginBot(bot) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bot),
  });
  const data = await res.json();
  if (!data.success) throw new Error(`Login failed for ${bot.email}: ${data.message}`);
  return { token: data.data.access_token, user: data.data.user };
}

async function startBot(botInfo, index) {
  const { token, user } = await loginBot(botInfo);
  console.log(`🤖 Bot ${index + 1} (${user.username}) logged in`);

  const socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
  });

  return new Promise((resolve) => {
    socket.on('connect', () => {
      console.log(`🔌 Bot ${user.username} connected (socket: ${socket.id})`);
      // Small delay to let server fully register handlers
      setTimeout(() => {
        console.log(`📤 Bot ${user.username} emitting lobby:join for room ${ROOM_CODE}`);
        socket.emit('lobby:join', { room_code: ROOM_CODE });
      }, 200);
    });

    socket.on('connected', (data) => {
      console.log(`✨ Bot ${user.username}: server says "${data.message}"`);
    });

    socket.on('lobby:joined', (data) => {
      console.log(`✅ Bot ${user.username} joined room ${data.room_code} (game_id: ${data.game_id})`);
    });

    socket.on('lobby:updated', (data) => {
      console.log(`📊 Bot ${user.username}: lobby updated — ${data.players?.length} players`);
    });

    socket.on('lobby:player_joined', (data) => {
      console.log(`👋 Bot ${user.username}: ${data.player?.username} joined`);
    });

    socket.on('error', (err) => {
      console.error(`❌ Bot ${user.username} error:`, err.message || JSON.stringify(err));
    });

    socket.on('connect_error', (err) => {
      console.error(`💥 Bot ${user.username} connect_error:`, err.message);
    });

    // Game Events
    socket.on('game:role_assigned', (data) => {
      console.log(`🎭 Bot ${user.username}: vai trò = ${data.role.slug} (${data.role.team})`);
    });

    socket.on('game:phase_change', (data) => {
      console.log(`📢 Bot ${user.username}: Phase = ${data.phase} (Round ${data.round})`);
      
      // Auto vote during vote phase
      if (data.phase === 'vote' && data.voteTargets) {
        const targets = data.voteTargets.filter(t => t.userId !== user.id);
        if (targets.length > 0) {
          const target = targets[Math.floor(Math.random() * targets.length)];
          setTimeout(() => {
            console.log(`🗳️ Bot ${user.username} votes for ${target.username}`);
            socket.emit('game:vote', { target_id: target.userId });
          }, Math.random() * 3000 + 1000);
        }
      }
    });

    socket.on('game:night_action_prompt', (data) => {
      console.log(`🌙 Bot ${user.username}: Night action prompt (${data.actionType || data.roleSlug})`);
      
      // Auto-pick random target
      if (data.targets && data.targets.length > 0) {
        const target = data.targets[Math.floor(Math.random() * data.targets.length)];
        const actionType = data.actionType || 'wolf_kill';
        console.log(`  → Bot ${user.username} chọn: ${target.username} (${actionType})`);
        socket.emit('game:night_action', { action_type: actionType, target_id: target.userId });
      } else if (data.actions) {
        // Witch style actions — pick first available
        const firstAction = data.actions.find(a => a.targets && a.targets.length > 0);
        if (firstAction) {
          const target = firstAction.targets[Math.floor(Math.random() * firstAction.targets.length)];
          console.log(`  → Bot ${user.username} chọn: ${target.username} (${firstAction.type})`);
          socket.emit('game:night_action', { action_type: firstAction.type, target_id: target.userId });
        } else {
          // Skip
          const skipAction = data.actions.find(a => a.type === 'witch_skip');
          if (skipAction) {
            socket.emit('game:night_action', { action_type: 'witch_skip', target_id: null });
          }
        }
      }
    });

    socket.on('game:action_confirmed', () => {
      console.log(`  ✅ Bot ${user.username}: Action confirmed`);
    });

    socket.on('game:vote_confirmed', () => {
      console.log(`  ✅ Bot ${user.username}: Vote confirmed`);
    });

    socket.on('game:seer_result', (data) => {
      console.log(`🔮 Bot ${user.username} Seer: ${data.targetUsername} = ${data.aura}`);
    });

    socket.on('game:ended', (data) => {
      console.log(`\n🏁 GAME ENDED: ${data.reason}`);
      console.log('Role Reveal:');
      data.roleReveal.forEach(r => {
        console.log(`  ${r.isAlive ? '✅' : '💀'} ${r.username}: ${r.roleSlug} (${r.team})`);
      });
      setTimeout(() => process.exit(0), 5000);
    });

    socket.on('game:hunter_shot_prompt', (data) => {
      console.log(`🏹 Bot ${user.username}: Hunter shot prompt!`);
      if (data.targets && data.targets.length > 0) {
        const target = data.targets[Math.floor(Math.random() * data.targets.length)];
        socket.emit('game:hunter_shot', { target_id: target.userId });
      }
    });

    socket.on('chat:message', (msg) => {
      if (msg.is_system) {
        console.log(`💬 [SYS] ${msg.content}`);
      }
    });

    socket.on('lobby:countdown', ({ seconds }) => {
      console.log(`⏱️ Bot ${user.username}: Game starts in ${seconds}s!`);
    });

    socket.on('game:init', (data) => {
      console.log(`🎮 Bot ${user.username}: Game init! ${data.players.length} players`);
    });

    socket.on('game:timer', (data) => {
      // silent — just update timer
    });

    // Resolve after a short delay to ensure connection is stable
    setTimeout(() => resolve({ socket, user }), 500);
  });
}

async function main() {
  console.log(`\n🤖 Starting ${BOTS.length} bots for room: ${ROOM_CODE}\n`);
  
  for (let i = 0; i < BOTS.length; i++) {
    try {
      await startBot(BOTS[i], i);
      // Longer stagger to avoid race conditions
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`Failed to start bot ${i + 1}:`, err.message);
    }
  }
  
  console.log(`\n✅ All ${BOTS.length} bots connected and waiting for game to start.\n`);
  console.log('Go to the lobby and click "Bắt Đầu Game" to start!\n');
}

main().catch(console.error);
