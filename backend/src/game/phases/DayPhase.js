/**
 * DayPhase — Giai đoạn sáng (thông báo kết quả đêm)
 * Hiển thị ai chết, ai được cứu, hệ thống thông báo
 * + Last Will support (theo wiki custom rules)
 * + Arsonist fire notifications
 * + Cupid broken heart notifications
 */

const DAY_DURATION = 10; // giây — thời gian đọc kết quả đêm (khớp Wolvesville gốc)

/**
 * Tạo thông báo sáng dựa trên kết quả đêm
 * @param {Object} nightResults - Từ resolveNight()
 * @param {number} round - Round hiện tại
 * @param {Object} lobbyRules - Custom lobby rules
 * @returns {Object[]} messages - Danh sách system messages
 */
function generateDawnMessages(nightResults, round, lobbyRules = {}) {
  const messages = [];
  
  messages.push({
    type: 'system',
    channel: 'public',
    content: `☀️ Bình minh ló dạng... (Vòng ${round})`,
    icon: '☀️',
  });
  
  if (nightResults.deaths.length === 0 && nightResults.saves.length === 0) {
    messages.push({
      type: 'system',
      channel: 'public',
      content: '🌅 Một đêm yên bình! Không ai bị giết.',
      icon: '🌅',
    });
  } else {
    // Thông báo người chết
    for (const death of nightResults.deaths) {
      let deathMsg = '';
      let icon = '💀';
      switch (death.cause) {
        case 'wolf_kill':
          deathMsg = `🐺 ${death.username} đã bị Sói cắn chết trong đêm!`;
          icon = '🐺';
          break;
        case 'poison':
          deathMsg = `☠️ ${death.username} đã bị đầu độc trong đêm!`;
          icon = '☠️';
          break;
        case 'serial_kill':
          deathMsg = `🔪 ${death.username} đã bị giết bởi một kẻ bí ẩn!`;
          icon = '🔪';
          break;
        case 'bodyguard_sacrifice':
          deathMsg = `⚔️ ${death.username} đã hy sinh để bảo vệ người khác!`;
          icon = '⚔️';
          break;
        case 'arson':
          deathMsg = `🔥 ${death.username} đã bị thiêu cháy bởi Hỏa Tặc!`;
          icon = '🔥';
          break;
        case 'broken_heart':
          deathMsg = `💔 ${death.username} chết vì mất đi người yêu!`;
          icon = '💔';
          break;
        case 'jailer_execute':
          deathMsg = `⛓️ ${death.username} đã bị Cai Ngục xử tử trong đêm!`;
          icon = '⛓️';
          break;
        default:
          deathMsg = `💀 ${death.username} đã chết trong đêm!`;
      }
      
      // Ẩn vai trò khi chết (custom rule)
      if (!lobbyRules.hideRoleOnDeath && death.roleSlug) {
        deathMsg += ` (${death.roleSlug})`;
      }
      
      messages.push({
        type: 'death',
        channel: 'public',
        content: deathMsg,
        playerId: death.playerId,
        roleSlug: lobbyRules.hideRoleOnDeath ? null : death.roleSlug,
        icon,
      });
    }
    
    // Thông báo người được cứu (chỉ nói "ai đó đã được cứu", không lộ bởi ai)
    if (nightResults.saves.length > 0) {
      messages.push({
        type: 'system',
        channel: 'public',
        content: `💖 Có ${nightResults.saves.length > 1 ? nightResults.saves.length + ' người' : 'người'} đã được cứu sống trong đêm qua!`,
        icon: '💖',
      });
    }
  }
  
  // Jailer notification
  if (nightResults.jailedPlayer) {
    messages.push({
      type: 'system',
      channel: 'public',
      content: `⛓️ Có một người chơi đã bị giam trong đêm.`,
      icon: '⛓️',
    });
  }
  
  // Custom events from night
  if (nightResults.events) {
    for (const evt of nightResults.events) {
      if (evt.type === 'arson' || evt.type === 'broken_heart' || evt.type === 'bodyguard_sacrifice') {
        messages.push({
          type: evt.type,
          channel: 'public',
          content: evt.message,
          icon: evt.type === 'arson' ? '🔥' : evt.type === 'broken_heart' ? '💔' : '⚔️',
        });
      }
    }
  }
  
  return messages;
}

module.exports = { generateDawnMessages, DAY_DURATION };
