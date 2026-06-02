const { GameMessage } = require('../models');

/**
 * Chat Socket Handler — Xử lý tin nhắn real-time
 */
function chatHandler(io, socket) {
  const userId = socket.data.userId;
  const username = socket.data.username;

  socket.on('chat:send', async ({ channel = 'public', content }) => {
    try {
      const gameId = socket.data.gameId;
      if (!gameId) return;

      // Validate content
      if (!content || content.trim().length === 0) return;
      if (content.length > 300) {
        return socket.emit('error', { message: 'Tin nhắn quá dài (tối đa 300 ký tự)' });
      }

      const cleanContent = content.trim().substring(0, 300);

      // TODO: Kiểm tra channel permission (wolf channel chỉ cho Sói)
      const allowedChannels = ['public', 'wolf', 'dead', 'jail'];
      if (!allowedChannels.includes(channel)) return;

      const { getActiveGame } = require('../game/GameEngine');
      const game = getActiveGame(gameId);
      if (!game) return;

      const state = await game.gameState.get();
      const p = await game.gameState.getPlayer(userId);
      const players = await game.gameState.getAllPlayers();

      // Xử lý kênh chat giam ngục riêng tư giữa Cai Ngục và mục tiêu
      if (channel === 'jail') {
        if (state.phase !== 'night') {
          return socket.emit('error', { message: 'Kênh chat giam ngục chỉ hoạt động vào ban đêm.' });
        }

        let jailerId = null;
        let jailedPlayerId = null;

        for (const [pid, player] of Object.entries(players)) {
          if (player.roleSlug === 'jailer' && player.isAlive) {
            jailerId = pid;
            jailedPlayerId = player.roleData?.nextJailed || null;
            break;
          }
        }

        if (!jailerId || !jailedPlayerId) {
          return socket.emit('error', { message: 'Không có ai bị giam giữ đêm nay.' });
        }

        if (userId?.toString() !== jailerId?.toString() && userId?.toString() !== jailedPlayerId?.toString()) {
          return socket.emit('error', { message: 'Bạn không có quyền chat ở kênh này.' });
        }

        // Broadcast to jailer and jailed player sockets
        const jailerSocket = game.players.find(p => p.userId?.toString() === jailerId?.toString())?.socket_id;
        const jailedSocket = game.players.find(p => p.userId?.toString() === jailedPlayerId?.toString())?.socket_id;

        const chatMsg = {
          id: 'jail_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          sender: { 
            userId, 
            username: userId?.toString() === jailerId?.toString() ? 'Cai Ngục' : 'Tù Nhân' 
          },
          channel: 'jail',
          content: cleanContent,
          timestamp: new Date(),
        };

        if (jailerSocket) {
          // Jailer sees the jailed target's username
          const msgForJailer = {
            ...chatMsg,
            sender: {
              userId,
              username: userId?.toString() === jailerId?.toString() ? 'Bạn (Cai Ngục)' : players[jailedPlayerId].username
            }
          };
          io.to(jailerSocket).emit('chat:message', msgForJailer);
        }

        if (jailedSocket) {
          // Jailed player sees the Jailer as "Cai Ngục" anonymous
          const msgForJailed = {
            ...chatMsg,
            sender: {
              userId,
              username: userId?.toString() === jailerId?.toString() ? 'Cai Ngục' : 'Bạn (Tù Nhân)'
            }
          };
          io.to(jailedSocket).emit('chat:message', msgForJailed);
        }

        return; // Không lưu vào DB
      }

      // Xử lý kênh chat âm hồn (người chết và ngoại cảm)
      if (channel === 'dead') {
        if (p.isAlive && (p.roleSlug !== 'medium' || state.phase !== 'night')) {
          return socket.emit('error', { message: 'Bạn không có quyền chat ở kênh này.' });
        }

        const message = await GameMessage.create({
          game_id: gameId,
          sender_id: null,
          channel,
          content: cleanContent,
          is_system: false,
        });

        for (const [pid, player] of Object.entries(players)) {
          if (!player.isAlive || (player.roleSlug === 'medium' && player.isAlive)) {
            const targetSocket = game.players.find(gp => gp.userId?.toString() === pid?.toString())?.socket_id;
            if (targetSocket) {
              io.to(targetSocket).emit('chat:message', {
                id: message.id,
                sender: { userId, username },
                channel,
                content: cleanContent,
                timestamp: message.created_at,
              });
            }
          }
        }
        return;
      }

      // Lưu vào DB
      const message = await GameMessage.create({
        game_id: gameId,
        sender_id: null, // TODO: link to game_player id
        channel,
        content: cleanContent,
        is_system: false,
      });

      // Broadcast đến room (hoặc channel-specific)
      const roomTarget = channel === 'public' ? `game:${gameId}` : `game:${gameId}:${channel}`;

      io.to(roomTarget).emit('chat:message', {
        id: message.id,
        sender: { userId, username },
        channel,
        content: cleanContent,
        timestamp: message.created_at,
      });

    } catch (err) {
      console.error('chat:send error:', err);
    }
  });
}

/**
 * Gửi system message đến phòng game
 */
async function sendSystemMessage(io, gameId, content, channel = 'public') {
  try {
    await GameMessage.create({
      game_id: gameId,
      sender_id: null,
      channel,
      content,
      is_system: true,
    });

    io.to(`game:${gameId}`).emit('chat:message', {
      id: null,
      sender: null,
      channel,
      content,
      is_system: true,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('sendSystemMessage error:', err);
  }
}

module.exports = chatHandler;
module.exports.sendSystemMessage = sendSystemMessage;
