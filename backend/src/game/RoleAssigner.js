/**
 * RoleAssigner — Gán vai ngẫu nhiên cho người chơi
 * 
 * Logic:
 * - Với custom game: dùng role_config từ host
 * - Với quick/ranked: tự cân bằng dựa trên số người chơi
 * - Đảm bảo: ít nhất 1 sói, 1 tiên tri, tỷ lệ sói ~ 25-30%
 * 
 * Wiki roles reference:
 * - Village (78): villager, seer, doctor, hunter, witch, bodyguard, detective, mayor, gunner, jailer, medium, cupid_village
 * - Werewolf (34): werewolf, alpha_wolf, wolf_seer, wolf_shaman
 * - Solo Voting (3): jester, headhunter
 * - Solo Killer (22): serial_killer, arsonist, sect_leader
 */

// Cấu hình vai trò mặc định theo số người chơi
const DEFAULT_CONFIGS = {
  // 4 người: 1 sói, 3 dân (MVP test)
  4: { werewolf: 1, seer: 1, doctor: 1, villager: 1 },
  // 6 người: 2 sói, 4 dân
  6: { werewolf: 2, seer: 1, doctor: 1, villager: 2 },
  // 8 người: 2 sói, 6 dân
  8: { werewolf: 2, seer: 1, doctor: 1, witch: 1, hunter: 1, villager: 2 },
  // 10 người: 3 sói, 7 dân (thêm gunner + jailer)
  10: { werewolf: 2, alpha_wolf: 1, seer: 1, doctor: 1, witch: 1, hunter: 1, gunner: 1, villager: 2 },
  // 12 người: 3 sói, 1 solo, 8 dân (thêm medium + cupid)
  12: { werewolf: 2, alpha_wolf: 1, seer: 1, doctor: 1, witch: 1, hunter: 1, bodyguard: 1, gunner: 1, jester: 1, villager: 2 },
  // 16 người: 4 sói, 2 solo, 10 dân (full roster)
  16: { werewolf: 3, alpha_wolf: 1, seer: 1, doctor: 1, witch: 1, hunter: 1, bodyguard: 1, detective: 1, mayor: 1, gunner: 1, jailer: 1, jester: 1, serial_killer: 1, villager: 2 },
  // 20 người: 5 sói, 2 solo, 13 dân
  20: { werewolf: 3, alpha_wolf: 1, wolf_seer: 1, seer: 1, doctor: 1, witch: 1, hunter: 1, bodyguard: 1, detective: 1, mayor: 1, gunner: 1, jailer: 1, medium: 1, cupid: 1, jester: 1, serial_killer: 1, arsonist: 1, villager: 2 },
  // 25 người: max
  25: { werewolf: 4, alpha_wolf: 1, wolf_seer: 1, seer: 1, doctor: 1, witch: 1, hunter: 1, bodyguard: 1, detective: 1, mayor: 1, gunner: 1, jailer: 1, medium: 1, cupid: 1, jester: 1, serial_killer: 1, arsonist: 1, headhunter: 1, villager: 5 },
};

// Thông tin vai trò cho mỗi slug
const ROLE_INFO = {
  // === PHE DÂN LÀNG (Village Team) ===
  villager:      { team: 'village',  aura: 'good',    hasNightAction: false, canChatAtNight: false },
  seer:          { team: 'village',  aura: 'good',    hasNightAction: true,  canChatAtNight: false },
  doctor:        { team: 'village',  aura: 'good',    hasNightAction: true,  canChatAtNight: false },
  hunter:        { team: 'village',  aura: 'good',    hasNightAction: false, canChatAtNight: false },
  witch:         { team: 'village',  aura: 'good',    hasNightAction: true,  canChatAtNight: false },
  bodyguard:     { team: 'village',  aura: 'good',    hasNightAction: true,  canChatAtNight: false },
  detective:     { team: 'village',  aura: 'good',    hasNightAction: true,  canChatAtNight: false },
  mayor:         { team: 'village',  aura: 'good',    hasNightAction: false, canChatAtNight: false },
  gunner:        { team: 'village',  aura: 'good',    hasNightAction: false, canChatAtNight: false },
  jailer:        { team: 'village',  aura: 'good',    hasNightAction: true,  canChatAtNight: false },
  medium:        { team: 'village',  aura: 'good',    hasNightAction: true,  canChatAtNight: false },
  
  // === PHE SÓI (Werewolf Team) ===
  werewolf:      { team: 'werewolf', aura: 'evil',    hasNightAction: true,  canChatAtNight: true  },
  alpha_wolf:    { team: 'werewolf', aura: 'evil',    hasNightAction: true,  canChatAtNight: true  },
  wolf_seer:     { team: 'werewolf', aura: 'evil',    hasNightAction: true,  canChatAtNight: true  },

  // === PHE ĐỘC LẬP (Solo) ===
  jester:        { team: 'solo',     aura: 'neutral', hasNightAction: false, canChatAtNight: false },
  headhunter:    { team: 'solo',     aura: 'neutral', hasNightAction: false, canChatAtNight: false },
  serial_killer: { team: 'solo',     aura: 'evil',    hasNightAction: true,  canChatAtNight: false },
  arsonist:      { team: 'solo',     aura: 'evil',    hasNightAction: true,  canChatAtNight: false },
  cupid:         { team: 'solo',     aura: 'good',    hasNightAction: true,  canChatAtNight: false },
};

/**
 * Shuffle array ngẫu nhiên (Fisher-Yates)
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Tạo danh sách vai trò dựa trên config
 * @param {Object} roleConfig - { slug: count } ví dụ: { werewolf: 2, seer: 1 }
 * @param {number} playerCount - Số người chơi
 * @returns {string[]} Mảng các slug vai trò
 */
function buildRoleList(roleConfig, playerCount) {
  let roles = [];
  for (const [slug, count] of Object.entries(roleConfig)) {
    if (slug === 'villager') continue; // Thêm villager cuối cùng
    for (let i = 0; i < count; i++) {
      roles.push(slug);
    }
  }
  
  // Lấp đầy bằng villager nếu thiếu
  const villagersNeeded = playerCount - roles.length;
  for (let i = 0; i < villagersNeeded; i++) {
    roles.push('villager');
  }
  
  return roles;
}

/**
 * Gán vai trò cho danh sách người chơi
 * @param {Array<{userId: string, username: string}>} players - Danh sách người chơi
 * @param {Object} roleConfig - Cấu hình vai trò (optional)
 * @returns {Object} playerRoles - { playerId: { role, team, aura, seatNumber, ... } }
 */
function assignRoles(players, roleConfig = null) {
  const playerCount = players.length;
  
  // Xác định config
  const config = roleConfig && Object.keys(roleConfig).length > 0
    ? roleConfig
    : getDefaultConfig(playerCount);
  
  // Tạo danh sách vai trò và shuffle
  const roleList = shuffle(buildRoleList(config, playerCount));
  
  // Shuffle vị trí ngồi
  const shuffledPlayers = shuffle(players);
  
  // Gán vai + seat number
  const assignments = {};
  shuffledPlayers.forEach((player, index) => {
    const roleSlug = roleList[index];
    const roleInfo = ROLE_INFO[roleSlug] || ROLE_INFO.villager;
    
    assignments[player.userId] = {
      userId: player.userId,
      username: player.username,
      roleSlug,
      team: roleInfo.team,
      aura: roleInfo.aura,
      hasNightAction: roleInfo.hasNightAction,
      canChatAtNight: roleInfo.canChatAtNight,
      isAlive: true,
      seatNumber: index + 1,
      deathRound: null,
      deathCause: null,
      // Role-specific data
      roleData: initRoleData(roleSlug),
    };
  });
  
  return assignments;
}

/**
 * Lấy cấu hình mặc định gần nhất cho số người chơi
 */
function getDefaultConfig(playerCount) {
  // Tìm config gần nhất <= playerCount
  const keys = Object.keys(DEFAULT_CONFIGS).map(Number).sort((a, b) => a - b);
  let closest = keys[0];
  for (const k of keys) {
    if (k <= playerCount) closest = k;
    else break;
  }
  return { ...DEFAULT_CONFIGS[closest] };
}

/**
 * Khởi tạo dữ liệu riêng cho mỗi vai trò
 */
function initRoleData(roleSlug) {
  switch (roleSlug) {
    case 'doctor':
      return { lastSaved: null };  // Không tự cứu 2 đêm liên tiếp
    case 'witch':
      return { healUsed: false, poisonUsed: false };
    case 'hunter':
      return { shotUsed: false };
    case 'bodyguard':
      return { protecting: null, lastProtected: null };
    case 'seer':
    case 'wolf_seer':
      return { checks: [] };  // Lịch sử xem aura
    case 'detective':
      return { investigations: [] };
    case 'alpha_wolf':
      return { revealOnDeath: false };
    case 'serial_killer':
      return { kills: 0 };
    case 'jester':
      return { wasVoted: false };
    case 'gunner':
      return { bullets: 2, lastShotRound: null };  // 2 viên đạn bạc
    case 'jailer':
      return { jailedPlayer: null, canExecute: true, lastJailed: null, nextJailed: null };
    case 'medium':
      return { reviveUsed: false };
    case 'cupid':
      return { linked: false, lovers: [] };
    case 'arsonist':
      return { doused: [], ignited: false };
    case 'headhunter':
      return { target: null, won: false };
    default:
      return {};
  }
}

module.exports = { assignRoles, ROLE_INFO, DEFAULT_CONFIGS, getDefaultConfig };
