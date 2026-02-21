// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = 3000;
const USERNAME = 'buivinhphuchotboykeokeo';

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

let connection;
function connectToLive() {
  connection = new WebcastPushConnection(USERNAME, {
    enableExtendedGiftInfo: true,
    requestPollingIntervalMs: 2000,
  });

  connection.connect()
    .then(state => {
      console.log(`→ KẾT NỐI THÀNH CÔNG tới @${USERNAME} | Room ID: ${state.roomId}`);
      io.emit('status', `Đã kết nối LIVE thành công! Room: ${state.roomId}`);
    })
    .catch(err => {
      console.error('Lỗi kết nối:', err.message);
      io.emit('status', `Lỗi kết nối: ${err.message.includes('offline') ? 'Streamer chưa live!' : err.message}`);
      if (err.message.includes('offline') || err.message.includes('not online')) {
        setTimeout(connectToLive, 8000);
      }
    });
}

connectToLive();

// Xử lý gift (donate)
connection.on('gift', data => {
  const giftName = data.giftName || data.gift?.name || 'Quà lạ';
  const repeat = data.repeatCount || 1;
  const diamond = data.diamondCount || data.gift?.diamondCount || 0;

  io.emit('donate', { giftName, repeat, diamond });
});

// Xử lý comment (bình luận)
connection.on('chat', data => {
  const comment = data.comment?.trim().toLowerCase() || '';

  if (comment === 'đỏ') {
    io.emit('comment_spawn', { team: 'B' });
    console.log('[CMT] Bình luận "đỏ" → phe Đỏ nhận 1 tướng');
  } else if (comment === 'xanh') {
    io.emit('comment_spawn', { team: 'A' });
    console.log('[CMT] Bình luận "xanh" → phe Xanh nhận 1 tướng');
  }
});

connection.on('error', err => console.error('[ERROR]', err));
connection.on('streamEnd', () => {
  console.log('Live kết thúc');
  setTimeout(connectToLive, 15000);
});

server.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
