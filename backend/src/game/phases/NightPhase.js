/**
 * NightPhase — Xử lý giai đoạn đêm
 * 
 * Thứ tự ưu tiên hành động đêm (theo Wolvesville Wiki / researcher.md):
 * 1. Jailer giam người (jailer_jail) — phải đi trước, vì người bị giam không thể hành động
 * 2. Cupid ghép cặp (cupid_link) — chỉ đêm 1
 * 3. Arsonist đổ dầu / đốt (arsonist_douse / arsonist_ignite) 
 * 4. Serial Killer giết (sk_kill)
 * 5. Sói chọn mục tiêu (wolf_kill)
 * 6. Wolf Seer xem aura (wolf_seer_check)
 * 7. Tiên Tri xem aura (seer_check)
 * 8. Bác Sĩ cứu (doctor_save)
 * 9. Phù Thủy (witch_heal / witch_poison)
 * 10. Vệ Sĩ (bodyguard_protect)
 * 11. Thám Tử (detective_investigate)
 * 12. Medium giao tiếp người chết (medium_revive)
 */

const NIGHT_DURATION = 15; // giây — khớp với Wolvesville gốc (30s)

/**
 * Xử lý tất cả hành động đêm và trả về kết quả
 * @param {GameState} gameState 
 * @param {Object} lobbyRules - Custom lobby rules (optional)
 * @returns {Object} results - { deaths: [], saves: [], seerResults: [], events: [], lovers: [] }
 */
async function resolveNight(gameState, lobbyRules = {}) {
  const actions = await gameState.getAllNightActions();
  const players = await gameState.getAllPlayers();
  const state = await gameState.get();

  const results = {
    deaths: [],       // [{playerId, username, cause, killedBy, roleSlug}]
    saves: [],        // [{playerId, username, savedBy}]
    seerResults: [],  // [{seerId, targetId, aura}]
    events: [],       // [{type, message}] - System messages
    wolfTarget: null,
    skTarget: null,
    lovers: [],       // [{player1Id, player2Id}] — from Cupid
    jailedPlayer: null, // player who was jailed
    lastWills: [],    // [{playerId, username, content}] — if Last Will enabled
  };

  // ============================================================
  // 1. JAILER — Giam người (vô hiệu hóa hành động đêm của người bị giam)
  // ============================================================
  let jailedPlayerId = null;
  let jailerId = null;

  // Tìm Cai Ngục
  for (const [playerId, player] of Object.entries(players)) {
    if (player.roleSlug === 'jailer') {
      if (player.isAlive) {
        jailerId = playerId;
        if (player.roleData?.nextJailed) {
          jailedPlayerId = player.roleData.nextJailed;
          results.jailedPlayer = jailedPlayerId;
          results.events.push({
            type: 'jail',
            message: `⛓️ Cai Ngục đã giam một người chơi đêm nay.`,
          });
          // Cập nhật lastJailed = jailedPlayerId, reset nextJailed = null
          await gameState.updatePlayer(playerId, {
            roleData: { ...player.roleData, lastJailed: jailedPlayerId, nextJailed: null }
          });
        }
      } else if (player.roleData?.nextJailed) {
        // Xóa trạng thái giam nếu Cai Ngục đã chết
        await gameState.updatePlayer(playerId, {
          roleData: { ...player.roleData, nextJailed: null }
        });
      }
    }
  }

  // Jailer execution
  for (const [playerId, action] of Object.entries(actions)) {
    if (action.actionType === 'jailer_execute' && action.targetId && playerId?.toString() === jailerId?.toString()) {
      const jailer = players[playerId];
      if (jailer?.roleData?.canExecute) {
        results.deaths.push({
          playerId: action.targetId,
          username: players[action.targetId]?.username,
          cause: 'jailer_execute',
          killedBy: 'jailer',
          roleSlug: players[action.targetId]?.roleSlug,
        });
        await gameState.updatePlayer(playerId, {
          roleData: { ...jailer.roleData, canExecute: false }
        });
      }
    }
  }

  // ============================================================
  // 2. CUPID — Ghép cặp (chỉ đêm 1)
  // ============================================================
  if (state.round === 1) {
    for (const [playerId, action] of Object.entries(actions)) {
      if (action.actionType === 'cupid_link' && action.targetId) {
        let t1, t2;
        if (typeof action.targetId === 'string' && action.targetId.includes(',')) {
          const parts = action.targetId.split(',');
          t1 = parts[0];
          t2 = parts[1];
        } else if (action.target2Id) {
          t1 = action.targetId;
          t2 = action.target2Id;
        } else if (Array.isArray(action.targetId) && action.targetId.length >= 2) {
          t1 = action.targetId[0];
          t2 = action.targetId[1];
        }

        if (t1 && t2) {
          const cupid = players[playerId];
          if (cupid?.roleSlug === 'cupid' && !cupid.roleData?.linked) {
            results.lovers.push({
              player1Id: t1,
              player2Id: t2,
            });
            await gameState.updatePlayer(playerId, {
              roleData: { ...cupid.roleData, linked: true, lovers: [t1, t2] }
            });
            // Reveal roles to each other
            const target1 = players[t1];
            const target2 = players[t2];
            if (target1 && target2) {
              results.events.push({
                type: 'system',
                playerId: t1,
                message: `💘 Thần Tình Yêu đã ghép đôi bạn với ${target2.username}. Họ là: ${target2.roleSlug}. Hãy bảo vệ nhau đến cùng!`,
              });
              results.events.push({
                type: 'system',
                playerId: t2,
                message: `💘 Thần Tình Yêu đã ghép đôi bạn với ${target1.username}. Họ là: ${target1.roleSlug}. Hãy bảo vệ nhau đến cùng!`,
              });
            }
          }
        }
      }
    }
  }

  // ============================================================
  // 3. ARSONIST — Đổ dầu / Đốt
  // ============================================================
  for (const [playerId, action] of Object.entries(actions)) {
    if (playerId?.toString() === jailedPlayerId?.toString()) continue; // Bị giam
    if (action.actionType === 'arsonist_douse' && action.targetId) {
      const arsonist = players[playerId];
      if (arsonist?.roleSlug === 'arsonist' && arsonist.isAlive) {
        const doused = arsonist.roleData?.doused || [];

        let targetsToDouse = [];
        if (Array.isArray(action.targetId)) {
          targetsToDouse = action.targetId;
        } else if (typeof action.targetId === 'string') {
          targetsToDouse = action.targetId.split(',').filter(Boolean);
        }

        let newDoused = [...doused];
        for (const tId of targetsToDouse) {
          if (players[tId]?.isAlive && !newDoused.includes(tId)) {
            newDoused.push(tId);
          }
        }

        await gameState.updatePlayer(playerId, {
          roleData: { ...arsonist.roleData, doused: newDoused }
        });
      }
    }
    if (action.actionType === 'arsonist_ignite') {
      const arsonist = players[playerId];
      if (arsonist?.roleSlug === 'arsonist' && arsonist.isAlive) {
        const doused = arsonist.roleData?.doused || [];
        for (const dousedId of doused) {
          const target = players[dousedId];
          if (target?.isAlive) {
            const alreadyDead = results.deaths.find(d => d.playerId === dousedId);
            if (!alreadyDead) {
              results.deaths.push({
                playerId: dousedId,
                username: target.username,
                cause: 'arson',
                killedBy: 'arsonist',
                roleSlug: target.roleSlug,
              });
            }
          }
        }
        await gameState.updatePlayer(playerId, {
          roleData: { ...arsonist.roleData, doused: [], ignited: true }
        });
        results.events.push({
          type: 'arson',
          message: `🔥 Hỏa Tặc đã châm lửa! ${doused.length} người bị thiêu cháy!`,
        });
      }
    }
  }

  // ============================================================
  // 4. SERIAL KILLER (sk_kill)
  // ============================================================
  let skTarget = null;
  for (const [playerId, action] of Object.entries(actions)) {
    if (playerId?.toString() === jailedPlayerId?.toString()) continue;
    if (action.actionType === 'sk_kill' && action.targetId) {
      skTarget = action.targetId;
    }
  }
  results.skTarget = skTarget;

  // ============================================================
  // 5. TÌM MỤC TIÊU CỦA SÓI (vote theo số đông, hòa thì random)
  // ============================================================
  const wolfVotes = {};
  for (const [playerId, action] of Object.entries(actions)) {
    if (playerId?.toString() === jailedPlayerId?.toString()) continue;
    if (action.actionType === 'wolf_kill' && action.targetId) {
      const targetId = action.targetId;
      wolfVotes[targetId] = (wolfVotes[targetId] || 0) + 1;
    }
  }

  let wolfTarget = null;
  if (Object.keys(wolfVotes).length > 0) {
    // Tìm số phiếu cao nhất
    const maxVotes = Math.max(...Object.values(wolfVotes));
    // Lọc tất cả target có số phiếu = maxVotes (có thể hòa)
    const topTargets = Object.entries(wolfVotes)
      .filter(([, votes]) => votes === maxVotes)
      .map(([targetId]) => targetId);

    if (topTargets.length === 1) {
      // Số đông rõ ràng → chọn target đó
      wolfTarget = topTargets[0];
    } else {
      // Hòa phiếu → chọn ngẫu nhiên 1 trong số những target bị hòa
      wolfTarget = topTargets[Math.floor(Math.random() * topTargets.length)];
      results.events.push({
        type: 'wolf_tie',
        message: `🐺 Bầy sói hòa phiếu! Nạn nhân được chọn ngẫu nhiên.`,
      });
    }
  }
  results.wolfTarget = wolfTarget;

  // ============================================================
  // 6. WOLF SEER — Xem aura (cho phe sói)
  // ============================================================
  for (const [playerId, action] of Object.entries(actions)) {
    if (playerId?.toString() === jailedPlayerId?.toString()) continue;
    if (action.actionType === 'wolf_seer_check' && action.targetId) {
      const target = players[action.targetId];
      if (target) {
        const player = players[playerId];
        results.seerResults.push({
          seerId: playerId,
          seerUsername: player?.username,
          targetId: action.targetId,
          targetUsername: target.username,
          aura: target.aura,
          isWolfSeer: true,
        });
      }
    }
  }

  // ============================================================
  // 7. XỬ LÝ TIÊN TRI (seer_check)
  // ============================================================
  for (const [playerId, action] of Object.entries(actions)) {
    if (playerId?.toString() === jailedPlayerId?.toString()) continue;
    if (action.actionType === 'seer_check' && action.targetId) {
      const target = players[action.targetId];
      if (target) {
        const player = players[playerId];
        // Alpha Wolf hiện là "good" khi bị Seer xem
        const shownAura = target.roleSlug === 'alpha_wolf' ? 'good' : target.aura;
        results.seerResults.push({
          seerId: playerId,
          seerUsername: player?.username,
          targetId: action.targetId,
          targetUsername: target.username,
          aura: shownAura,
          roleSlug: target.roleSlug,
        });
      }
    }
  }

  // ============================================================
  // 8. XỬ LÝ BÁC SĨ CỨU (doctor_save)
  // ============================================================
  let doctorSaveTarget = null;
  for (const [playerId, action] of Object.entries(actions)) {
    if (playerId?.toString() === jailedPlayerId?.toString()) continue;
    if (action.actionType === 'doctor_save' && action.targetId) {
      const player = players[playerId];
      const roleData = player?.roleData || {};
      // Không tự cứu liên tiếp 2 đêm
      if (action.targetId === playerId && roleData.lastSaved === playerId) {
        continue; // Skip - không được tự cứu liên tiếp
      }
      doctorSaveTarget = action.targetId;
      // Cập nhật lastSaved
      await gameState.updatePlayer(playerId, {
        roleData: { ...roleData, lastSaved: action.targetId }
      });
    }
  }

  // ============================================================
  // 9. XỬ LÝ PHÙ THỦY (witch_heal / witch_poison)
  // ============================================================
  let witchHealTarget = null;
  let witchPoisonTarget = null;
  let witchId = null;
  for (const [playerId, action] of Object.entries(actions)) {
    if (playerId?.toString() === jailedPlayerId?.toString()) continue;
    if (action.actionType === 'witch_heal' && action.targetId) {
      witchHealTarget = action.targetId;
      witchId = playerId;
      // Tạm thời trừ thuốc cứu, nếu không dùng đến sẽ hoàn lại sau
      await gameState.updatePlayer(playerId, {
        roleData: { ...players[playerId]?.roleData, healUsed: true }
      });
    }
    if (action.actionType === 'witch_poison' && action.targetId) {
      witchPoisonTarget = action.targetId;
      await gameState.updatePlayer(playerId, {
        roleData: { ...players[playerId]?.roleData, poisonUsed: true }
      });
    }
  }

  // ============================================================
  // 10. XỬ LÝ VỆ SĨ (bodyguard_protect)
  // ============================================================
  let bodyguardProtectTarget = null;
  let bodyguardId = Object.keys(players).find(pid => players[pid]?.roleSlug === 'bodyguard');

  for (const [playerId, action] of Object.entries(actions)) {
    if (playerId?.toString() === jailedPlayerId?.toString()) continue;
    if (action.actionType === 'bodyguard_protect' && action.targetId) {
      const bgData = players[playerId]?.roleData || {};
      // Không bảo vệ cùng người 2 đêm liên tiếp
      if (bgData.lastProtected === action.targetId) continue;
      bodyguardProtectTarget = action.targetId;
      bodyguardId = playerId;
      await gameState.updatePlayer(playerId, {
        roleData: { ...bgData, lastProtected: action.targetId }
      });
    }
  }

  // ============================================================
  // 11. XỬ LÝ THÁM TỬ (detective_investigate)
  // ============================================================
  for (const [playerId, action] of Object.entries(actions)) {
    if (playerId?.toString() === jailedPlayerId?.toString()) continue;
    if (action.actionType === 'detective_investigate' && action.targetId) {
      let targetIds = [];
      if (Array.isArray(action.targetId)) {
        targetIds = action.targetId;
      } else if (typeof action.targetId === 'string') {
        targetIds = action.targetId.split(',').filter(Boolean);
      }

      if (targetIds.length === 2) {
        const t1 = players[targetIds[0]];
        const t2 = players[targetIds[1]];
        if (t1 && t2) {
          const sameTeam = t1.team === t2.team;
          const message = sameTeam
            ? `🔍 ${t1.username} và ${t2.username} CÙNG một phe!`
            : `🔍 ${t1.username} và ${t2.username} KHÔNG cùng một phe!`;

          results.events.push({
            type: 'detective_result',
            playerId: playerId,
            targetId: action.targetId,
            message,
          });
        }
      }
    }
  }

  // ============================================================
  // GIẢI QUYẾT KẾT QUẢ — AI SỐNG, AI CHẾT?
  // ============================================================

  // Người bị giam không bị giết bởi sói hay SK (Jailer bảo vệ)
  const isJailed = (id) => id?.toString() === jailedPlayerId?.toString();

  // XỬ LÝ VỆ SĨ (GUARD) CƠ CHẾ BỊ THƯƠNG
  const bg = bodyguardId ? players[bodyguardId] : null;
  const bgActive = bg && bg.isAlive && !isJailed(bodyguardId);
  let bgInjuredThisNight = false;

  // A. Vệ Sĩ bị tấn công trực tiếp (sói cắn hoặc SK đâm)
  if (bgActive) {
    if (wolfTarget === bodyguardId && !isJailed(bodyguardId)) {
      if (!bg.roleData?.isInjured) {
        // Chỉ bị thương
        bg.roleData = { ...bg.roleData, isInjured: true };
        await gameState.updatePlayer(bodyguardId, { roleData: bg.roleData });
        bgInjuredThisNight = true;

        results.saves.push({
          playerId: bodyguardId,
          username: bg.username,
          savedBy: 'immune',
        });
        results.events.push({
          type: 'system',
          message: `🛡️ Vệ Sĩ bị Sói tấn công trực tiếp nhưng chỉ bị thương!`,
        });
        wolfTarget = null; // Chặn cuộc tấn công
      }
    }
    if (skTarget === bodyguardId && !isJailed(bodyguardId)) {
      if (!bg.roleData?.isInjured && !bgInjuredThisNight) {
        // Chỉ bị thương
        bg.roleData = { ...bg.roleData, isInjured: true };
        await gameState.updatePlayer(bodyguardId, { roleData: bg.roleData });
        bgInjuredThisNight = true;

        results.saves.push({
          playerId: bodyguardId,
          username: bg.username,
          savedBy: 'immune',
        });
        results.events.push({
          type: 'system',
          message: `🛡️ Vệ Sĩ bị Sát Nhân tấn công trực tiếp nhưng chỉ bị thương!`,
        });
        skTarget = null; // Chặn cuộc tấn công
      }
    }
  }

  // B. Người được Vệ Sĩ bảo vệ bị tấn công
  if (bgActive && bodyguardProtectTarget) {
    const targetPlayer = players[bodyguardProtectTarget];

    // B1. Bị Sói tấn công
    if (wolfTarget === bodyguardProtectTarget && targetPlayer?.isAlive && !isJailed(bodyguardProtectTarget)) {
      if (!bg.roleData?.isInjured) {
        // Vệ sĩ chưa bị thương -> cứu mục tiêu và vệ sĩ bị thương
        bg.roleData = { ...bg.roleData, isInjured: true };
        await gameState.updatePlayer(bodyguardId, { roleData: bg.roleData });
        bgInjuredThisNight = true;

        results.saves.push({
          playerId: wolfTarget,
          username: targetPlayer.username,
          savedBy: 'bodyguard',
        });
        results.events.push({
          type: 'bodyguard_save',
          message: `🛡️ Vệ Sĩ đã bị thương khi bảo vệ thành công ${targetPlayer.username} khỏi Sói!`,
        });
        wolfTarget = null; // Chặn cuộc tấn công
      } else {
        // Vệ sĩ đã bị thương từ trước -> không thể bảo vệ thành công nữa -> Vệ sĩ chết, Mục tiêu an toàn
        results.deaths.push({
          playerId: bodyguardId,
          username: bg.username,
          cause: 'bodyguard_protect',
          killedBy: 'werewolf',
          roleSlug: bg.roleSlug,
        });
        results.saves.push({
          playerId: wolfTarget,
          username: targetPlayer.username,
          savedBy: 'bodyguard',
        });
        wolfTarget = null;
      }
    }

    // B2. Bị Sát Nhân (SK) tấn công
    if (skTarget === bodyguardProtectTarget && targetPlayer?.isAlive && !isJailed(bodyguardProtectTarget)) {
      if (!bg.roleData?.isInjured && !bgInjuredThisNight) {
        // Vệ sĩ chưa bị thương -> cứu mục tiêu và vệ sĩ bị thương
        bg.roleData = { ...bg.roleData, isInjured: true };
        await gameState.updatePlayer(bodyguardId, { roleData: bg.roleData });
        bgInjuredThisNight = true;

        results.saves.push({
          playerId: skTarget,
          username: targetPlayer.username,
          savedBy: 'bodyguard',
        });
        results.events.push({
          type: 'bodyguard_save',
          message: `🛡️ Vệ Sĩ đã bị thương khi bảo vệ thành công ${targetPlayer.username} khỏi Sát Nhân!`,
        });
        skTarget = null; // Chặn cuộc tấn công
      } else {
        // Vệ sĩ đã bị thương từ trước -> không thể bảo vệ thành công nữa -> Vệ sĩ chết, Mục tiêu an toàn
        results.deaths.push({
          playerId: bodyguardId,
          username: bg.username,
          cause: 'bodyguard_protect',
          killedBy: 'serial_killer',
          roleSlug: bg.roleSlug,
        });
        results.saves.push({
          playerId: skTarget,
          username: targetPlayer.username,
          savedBy: 'bodyguard',
        });
        skTarget = null;
      }
    }
  }

  let witchHealUsedSuccessfully = false;

  // Sói giết
  if (wolfTarget && players[wolfTarget]?.isAlive && !isJailed(wolfTarget)) {
    if (['serial_killer', 'arsonist'].includes(players[wolfTarget]?.roleSlug)) {
      results.saves.push({
        playerId: wolfTarget,
        username: players[wolfTarget]?.username,
        savedBy: 'immune',
      });
      results.events.push({
        type: 'system',
        message: `🐺 Bầy sói đã tấn công một mục tiêu có thân thể bất hoại đêm nay!`,
      });
    } else {
      const saved = wolfTarget === doctorSaveTarget
        || wolfTarget === witchHealTarget;

      if (saved) {
        if (wolfTarget === witchHealTarget) witchHealUsedSuccessfully = true;
        results.saves.push({
          playerId: wolfTarget,
          username: players[wolfTarget]?.username,
          savedBy: wolfTarget === doctorSaveTarget ? 'doctor' : 'witch',
        });
      } else {
        results.deaths.push({
          playerId: wolfTarget,
          username: players[wolfTarget]?.username,
          cause: 'wolf_kill',
          killedBy: 'werewolf',
          roleSlug: players[wolfTarget]?.roleSlug,
        });
      }
    }
  }

  // Phù Thủy độc
  if (witchPoisonTarget && players[witchPoisonTarget]?.isAlive && !isJailed(witchPoisonTarget)) {
    // Kiểm tra không bị trùng với người đã chết bởi sói
    const alreadyDead = results.deaths.find(d => d.playerId === witchPoisonTarget);
    if (!alreadyDead) {
      results.deaths.push({
        playerId: witchPoisonTarget,
        username: players[witchPoisonTarget]?.username,
        cause: 'poison',
        killedBy: 'witch',
        roleSlug: players[witchPoisonTarget]?.roleSlug,
      });
    }
  }

  // Serial Killer giết
  if (skTarget && players[skTarget]?.isAlive && !isJailed(skTarget)) {
    const alreadyDead = results.deaths.find(d => d.playerId === skTarget);
    if (!alreadyDead) {
      // SK bị bảo vệ bởi Doctor hoặc Witch
      if (skTarget === doctorSaveTarget) {
        results.saves.push({
          playerId: skTarget,
          username: players[skTarget]?.username,
          savedBy: 'doctor',
        });
      } else if (skTarget === witchHealTarget) {
        witchHealUsedSuccessfully = true;
        results.saves.push({
          playerId: skTarget,
          username: players[skTarget]?.username,
          savedBy: 'witch',
        });
      } else {
        results.deaths.push({
          playerId: skTarget,
          username: players[skTarget]?.username,
          cause: 'serial_kill',
          killedBy: 'serial_killer',
          roleSlug: players[skTarget]?.roleSlug,
        });
      }
    }
  }

  // Hoàn trả thuốc cứu nếu mục tiêu không bị tấn công (chưa được sử dụng thành công)
  if (witchId && witchHealTarget && !witchHealUsedSuccessfully) {
    const witch = players[witchId];
    if (witch) {
      await gameState.updatePlayer(witchId, {
        roleData: { ...witch.roleData, healUsed: false }
      });
      results.events.push({
        type: 'system',
        message: `Phù Thủy đã không dùng thuốc cứu thành công đêm nay (mục tiêu không bị tấn công), thuốc được hoàn lại.`, // Có thể ẩn cho riêng phù thủy nếu cần, nhưng events này không gửi public
      });
    }
  }

  // ============================================================
  // CUPID LOVER CHECK — Nếu 1 người yêu chết, người kia cũng chết
  // ============================================================
  // Check all players for lovers
  for (const [pid, pData] of Object.entries(players)) {
    if (pData.roleSlug === 'cupid' && pData.roleData?.lovers?.length === 2) {
      const [l1, l2] = pData.roleData.lovers;
      const l1Dead = results.deaths.find(d => d.playerId === l1);
      const l2Dead = results.deaths.find(d => d.playerId === l2);

      if (l1Dead && !l2Dead && players[l2]?.isAlive) {
        results.deaths.push({
          playerId: l2,
          username: players[l2]?.username,
          cause: 'broken_heart',
          killedBy: 'cupid',
          roleSlug: players[l2]?.roleSlug,
        });
        results.events.push({
          type: 'broken_heart',
          message: `💔 ${players[l2]?.username} chết vì đau tim khi mất đi người yêu!`,
        });
      }
      if (l2Dead && !l1Dead && players[l1]?.isAlive) {
        results.deaths.push({
          playerId: l1,
          username: players[l1]?.username,
          cause: 'broken_heart',
          killedBy: 'cupid',
          roleSlug: players[l1]?.roleSlug,
        });
        results.events.push({
          type: 'broken_heart',
          message: `💔 ${players[l1]?.username} chết vì đau tim khi mất đi người yêu!`,
        });
      }
    }
  }

  // ============================================================
  // CẬP NHẬT TRẠNG THÁI CHẾT
  // ============================================================
  for (const death of results.deaths) {
    await gameState.updatePlayer(death.playerId, {
      isAlive: false,
      deathRound: state.round,
      deathCause: death.cause,
    });
  }

  // Cập nhật danh sách alive/dead trong state
  const updatedPlayers = await gameState.getAllPlayers();
  const alivePlayers = Object.keys(updatedPlayers).filter(id => updatedPlayers[id].isAlive);
  const deadPlayers = Object.keys(updatedPlayers).filter(id => !updatedPlayers[id].isAlive);
  await gameState.update({ alivePlayers, deadPlayers });

  // Clear night actions cho round mới
  await gameState.clearNightActions();

  return results;
}

module.exports = { resolveNight, NIGHT_DURATION };
