const API_URL = 'http://localhost:5000/api/v1';

const PLAYERS = [
  { username: 'test1_host', email: 'test1@game.com', password: 'test123456' },
  { username: 'bot2_player', email: 'bot2@test.com', password: 'test123456' },
  { username: 'bot3_player', email: 'bot3@test.com', password: 'test123456' },
  { username: 'bot4_player', email: 'bot4@test.com', password: 'test123456' },
];

async function registerPlayer(player) {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player),
    });
    const data = await res.json();
    if (res.status === 409) {
      console.log(`ℹ️ Player ${player.username} (${player.email}) already registered: ${data.message}`);
      return;
    }
    if (!data.success) {
      console.error(`❌ Registration failed for ${player.username}:`, data.message);
    } else {
      console.log(`✅ Registered ${player.username} successfully`);
    }
  } catch (error) {
    console.error(`❌ Error registering ${player.username}:`, error.message);
  }
}

async function main() {
  console.log('Registering test players...');
  for (const player of PLAYERS) {
    await registerPlayer(player);
  }
  console.log('Done!');
}

main().catch(console.error);
