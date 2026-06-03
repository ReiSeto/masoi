/**
 * VotePhase — Giai đoạn bỏ phiếu treo cổ
 * 
 * Logic:
 * - Mỗi người sống bỏ 1 phiếu (Thị Trưởng x2)
 * - Người bị nhiều phiếu nhất bị treo cổ
 * - Nếu hòa: không ai chết
 * - Kiểm tra Jester (nếu Jester bị vote → Jester thắng)
 * - Kiểm tra Hunter (nếu Hunter bị vote → được bắn 1 người)
 */

const VOTE_DURATION = 30; // giây — khớp với Wolvesville gốc (30s)

/**
 * Giải quyết phiếu bầu
 * @param {GameState} gameState 
 * @returns {Object} result
 */
async function resolveVotes(gameState) {
  const votes = await gameState.getAllVotes();
  const players = await gameState.getAllPlayers();
  const state = await gameState.get();

  const result = {
    voteCounts: {},   // { targetId: totalVotes }
    votedOutPlayer: null,
    isTie: false,
    hunterPending: false,
    jesterWin: false,
    events: [],
  };

  // Đếm phiếu
  for (const [voterId, targetId] of Object.entries(votes)) {
    if (!targetId || targetId === 'skip') continue;
    const voter = players[voterId];
    if (!voter?.isAlive) continue;

    // Thị Trưởng có 2 phiếu nếu đã lật bài
    const voteWeight = (voter.roleSlug === 'mayor' && voter.roleData?.revealed) ? 2 : 1;
    result.voteCounts[targetId] = (result.voteCounts[targetId] || 0) + voteWeight;
  }

  // Tìm người có nhiều phiếu nhất
  let maxVotes = 0;
  let topCandidates = [];
  for (const [targetId, count] of Object.entries(result.voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      topCandidates = [targetId];
    } else if (count === maxVotes) {
      topCandidates.push(targetId);
    }
  }

  // Tính số lượng người sống và ngưỡng quá bán (lynch threshold = Math.floor(aliveCount / 2))
  const alivePlayers = Object.values(players).filter(p => p.isAlive);
  const aliveCount = alivePlayers.length;
  const threshold = Math.floor(aliveCount / 2);

  // Kiểm tra hòa và ngưỡng quá bán
  if (topCandidates.length !== 1 || maxVotes === 0 || maxVotes < threshold) {
    result.isTie = true;
    let message = '⚖️ Phiếu bầu hòa! Không ai bị treo cổ.';
    if (maxVotes > 0 && maxVotes < threshold) {
      message = `⚖️ Không có ai bị treo cổ vì số phiếu cao nhất (${maxVotes} phiếu) chưa đạt quá bán (tối thiểu ${threshold} phiếu cho ${aliveCount} người sống)!`;
    }
    result.events.push({
      type: 'system',
      channel: 'public',
      content: message,
      icon: '⚖️',
    });
  } else {
    const votedPlayerId = topCandidates[0];
    const votedPlayer = players[votedPlayerId];
    result.votedOutPlayer = {
      playerId: votedPlayerId,
      username: votedPlayer?.username,
      roleSlug: votedPlayer?.roleSlug,
      team: votedPlayer?.team,
      votes: maxVotes,
    };

    // Kiểm tra Jester
    if (votedPlayer?.roleSlug === 'jester') {
      result.jesterWin = true;
      result.events.push({
        type: 'jester_win',
        channel: 'public',
        content: `🃏 ${votedPlayer.username} là KẺ HỀ! Kẻ Hề thắng cuộc!`,
        icon: '🃏',
      });
    } else {
      result.events.push({
        type: 'vote_death',
        channel: 'public',
        content: `⚰️ ${votedPlayer.username} đã bị treo cổ! Vai trò: ${votedPlayer.roleSlug}`,
        icon: '⚰️',
      });
    }

    // Cập nhật trạng thái chết
    await gameState.updatePlayer(votedPlayerId, {
      isAlive: false,
      deathRound: state.round,
      deathCause: 'voted',
    });

    // Kiểm tra Hunter — nếu bị vote chết, được bắn 1 người
    if (votedPlayer?.roleSlug === 'hunter' && !votedPlayer?.roleData?.shotUsed) {
      result.hunterPending = true;
      result.events.push({
        type: 'hunter_shot',
        channel: 'public',
        content: `🏹 ${votedPlayer.username} là Thợ Săn! Thợ Săn được chọn bắn chết 1 người!`,
        icon: '🏹',
      });
    }

    // Cập nhật alive/dead
    const updatedPlayers = await gameState.getAllPlayers();
    const alivePlayers = Object.keys(updatedPlayers).filter(id => updatedPlayers[id].isAlive);
    const deadPlayers = Object.keys(updatedPlayers).filter(id => !updatedPlayers[id].isAlive);
    await gameState.update({ alivePlayers, deadPlayers });
  }

  // Clear votes cho round mới
  await gameState.clearVotes();

  return result;
}

module.exports = { resolveVotes, VOTE_DURATION };
