/**
 * BotBrain — AI for bot players
 * 
 * Strategy levels:
 * - Wolves: target Seer/Doctor first, avoid voting wolf teammates
 * - Seer: check most suspicious (who voted differently)
 * - Doctor: protect self first night, then random non-wolf
 * - Gunner: shoot suspicious targets during day
 * - Jailer: jail suspicious players, execute confirmed wolves
 * - Arsonist: douse everyone, ignite when enough targets
 * - Vote: wolves coordinate, villagers vote random or suspicious
 */

const BOT_NAMES = [
  'WolfHunter', 'NightOwl', 'ShadowFox', 'LunarWolf', 
  'StarGazer', 'DarkKnight', 'SilentMoon', 'IronClaw',
  'FrostBite', 'ThunderPaw', 'GhostWalker', 'BloodMoon',
  'StormBreaker', 'NightCrawler', 'SilverFang', 'VoidStalker',
  'MoonShade', 'FireHeart', 'IceWarden', 'SkyHunter',
  'DarkWolf', 'MysticSeer', 'ShadowBlade', 'EmberFox',
  'CrystalGaze', 'PhantomWolf', 'NovaStar', 'DuskRider',
];

let botCounter = 0;

function generateBotId() {
  return `bot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateBotName() {
  const name = BOT_NAMES[botCounter % BOT_NAMES.length];
  botCounter++;
  return `🤖${name}`;
}

/**
 * Decide night action based on role
 */
function decideNightAction(botPlayer, allPlayers, gameState) {
  const alive = Object.entries(allPlayers).filter(([, p]) => p.isAlive);
  const roleSlug = botPlayer.roleSlug;
  const botId = botPlayer.userId;
  
  switch (roleSlug) {
    case 'werewolf':
    case 'alpha_wolf': {
      // Wolf strategy: prioritize Seer > Doctor > random villager
      const nonWolves = alive.filter(([, p]) => p.team !== 'werewolf');
      if (nonWolves.length === 0) return null;
      
      // Simple heuristic: kill a random non-wolf
      const target = nonWolves[Math.floor(Math.random() * nonWolves.length)];
      return { actionType: 'wolf_kill', targetId: target[0] };
    }
    
    case 'wolf_seer': {
      // Wolf Seer: kill + check aura
      const nonWolves = alive.filter(([, p]) => p.team !== 'werewolf');
      if (nonWolves.length === 0) return null;
      const killTarget = nonWolves[Math.floor(Math.random() * nonWolves.length)];
      // Also do a seer check on a different target
      const checkTargets = nonWolves.filter(([id]) => id !== killTarget[0]);
      if (checkTargets.length > 0) {
        // Wolf seer contributes kill vote AND checks
        return { actionType: 'wolf_kill', targetId: killTarget[0] };
      }
      return { actionType: 'wolf_kill', targetId: killTarget[0] };
    }
    
    case 'seer': {
      // Check someone not yet checked
      const others = alive.filter(([id]) => id !== botId);
      if (others.length === 0) return null;
      const target = others[Math.floor(Math.random() * others.length)];
      return { actionType: 'seer_check', targetId: target[0] };
    }
    
    case 'doctor': {
      // First night: protect self. Later: random alive player
      const round = gameState?.round || 1;
      if (round === 1) {
        return { actionType: 'doctor_save', targetId: botId };
      }
      const target = alive[Math.floor(Math.random() * alive.length)];
      return { actionType: 'doctor_save', targetId: target[0] };
    }
    
    case 'witch': {
      const rd = botPlayer.roleData || {};
      // Skip most of the time for witch
      if (!rd.healUsed && Math.random() < 0.3) {
        const target = alive[Math.floor(Math.random() * alive.length)];
        return { actionType: 'witch_heal', targetId: target[0] };
      }
      if (!rd.poisonUsed && Math.random() < 0.2) {
        const others = alive.filter(([id]) => id !== botId);
        if (others.length > 0) {
          const target = others[Math.floor(Math.random() * others.length)];
          return { actionType: 'witch_poison', targetId: target[0] };
        }
      }
      return { actionType: 'witch_skip', targetId: null };
    }
    
    case 'bodyguard': {
      const others = alive.filter(([id]) => id !== botId);
      if (others.length === 0) return null;
      // Don't protect same person twice
      const lastProtected = botPlayer.roleData?.lastProtected;
      const validTargets = others.filter(([id]) => id !== lastProtected);
      const pool = validTargets.length > 0 ? validTargets : others;
      const target = pool[Math.floor(Math.random() * pool.length)];
      return { actionType: 'bodyguard_protect', targetId: target[0] };
    }
    
    case 'serial_killer': {
      const others = alive.filter(([id]) => id !== botId);
      if (others.length === 0) return null;
      const target = others[Math.floor(Math.random() * others.length)];
      return { actionType: 'sk_kill', targetId: target[0] };
    }
    
    case 'detective': {
      const others = alive.filter(([id]) => id !== botId);
      if (others.length === 0) return null;
      const target = others[Math.floor(Math.random() * others.length)];
      return { actionType: 'detective_investigate', targetId: target[0] };
    }
    
    case 'jailer': {
      const others = alive.filter(([id]) => id !== botId);
      if (others.length === 0) return null;
      // Don't jail same person twice
      const lastJailed = botPlayer.roleData?.lastJailed;
      const validTargets = others.filter(([id]) => id !== lastJailed);
      const pool = validTargets.length > 0 ? validTargets : others;
      const target = pool[Math.floor(Math.random() * pool.length)];
      return { actionType: 'jailer_jail', targetId: target[0] };
    }
    
    case 'medium': {
      // Medium talks to dead - no real action needed for bot
      return null;
    }
    
    case 'cupid': {
      // Only act on night 1
      const round = gameState?.round || 1;
      if (round !== 1) return null;
      if (botPlayer.roleData?.linked) return null;
      const others = alive.filter(([id]) => id !== botId);
      if (others.length < 2) return null;
      const shuffled = others.sort(() => Math.random() - 0.5);
      return { 
        actionType: 'cupid_link', 
        targetId: `${shuffled[0][0]},${shuffled[1][0]}`
      };
    }
    
    case 'arsonist': {
      const rd = botPlayer.roleData || {};
      const doused = rd.doused || [];
      // If enough people are doused (3+), consider igniting
      if (doused.length >= 3 && Math.random() < 0.4) {
        return { actionType: 'arsonist_ignite' };
      }
      // Otherwise, douse someone new
      const others = alive.filter(([id]) => id !== botId && !doused.includes(id));
      if (others.length === 0) {
        // Everyone is doused, ignite!
        return { actionType: 'arsonist_ignite' };
      }
      const target = others[Math.floor(Math.random() * others.length)];
      return { actionType: 'arsonist_douse', targetId: target[0] };
    }
    
    case 'gunner': {
      // Gunner doesn't act at night
      return null;
    }
    
    default:
      return null;
  }
}

/**
 * Decide who to vote for
 * Wolves: avoid voting wolf teammates, target village power roles
 * Village: vote random (with slight preference for who seems suspicious)
 */
function decideVote(botPlayer, allPlayers) {
  const alive = Object.entries(allPlayers).filter(([id, p]) => 
    p.isAlive && id !== botPlayer.userId
  );
  
  if (alive.length === 0) return 'skip';
  
  const botTeam = botPlayer.team;
  
  if (botTeam === 'werewolf') {
    // Wolves: never vote wolf teammates, target village
    const nonWolves = alive.filter(([, p]) => p.team !== 'werewolf');
    if (nonWolves.length > 0) {
      const target = nonWolves[Math.floor(Math.random() * nonWolves.length)];
      return target[0];
    }
  }
  
  // Jester: try to get voted — skip voting to act innocent
  if (botPlayer.roleSlug === 'jester') {
    if (Math.random() < 0.6) return 'skip'; // Act innocent often
    // Sometimes vote randomly to blend in
    const target = alive[Math.floor(Math.random() * alive.length)];
    return target[0];
  }
  
  // Village / Solo: vote randomly
  // Small chance to skip (10%)
  if (Math.random() < 0.1) return 'skip';
  
  const target = alive[Math.floor(Math.random() * alive.length)];
  return target[0];
}

/**
 * Decide hunter shot target
 */
function decideHunterShot(botPlayer, allPlayers) {
  const alive = Object.entries(allPlayers).filter(([id, p]) => 
    p.isAlive && id !== botPlayer.userId
  );
  if (alive.length === 0) return null;
  
  // If wolf team: shoot a villager
  if (botPlayer.team === 'werewolf') {
    const nonWolves = alive.filter(([, p]) => p.team !== 'werewolf');
    if (nonWolves.length > 0) {
      const target = nonWolves[Math.floor(Math.random() * nonWolves.length)];
      return target[0];
    }
  }
  
  // Hunter shoots random alive player
  const target = alive[Math.floor(Math.random() * alive.length)];
  return target[0];
}

/**
 * Decide gunner shot target (day phase)
 */
function decideGunnerShot(botPlayer, allPlayers) {
  const alive = Object.entries(allPlayers).filter(([id, p]) => 
    p.isAlive && id !== botPlayer.userId
  );
  if (alive.length === 0) return null;
  
  // 20% chance to shoot during discuss phase
  if (Math.random() < 0.8) return null;
  
  if (botPlayer.team === 'village') {
    // Try to shoot non-village
    const suspicious = alive.filter(([, p]) => p.team !== 'village');
    if (suspicious.length > 0 && Math.random() < 0.3) {
      const target = suspicious[Math.floor(Math.random() * suspicious.length)];
      return target[0];
    }
  }
  
  const target = alive[Math.floor(Math.random() * alive.length)];
  return target[0];
}

module.exports = {
  generateBotId,
  generateBotName,
  decideNightAction,
  decideVote,
  decideHunterShot,
  decideGunnerShot,
  BOT_NAMES,
};
