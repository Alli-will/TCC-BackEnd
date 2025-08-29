const net = require('net');
const port = 587; // troque para 465 se quiser testar SSL
const host = 'smtp-relay.brevo.com';

console.log('Iniciando teste SMTP para', host, 'na porta', port);

const socket = net.createConnection(port, host, () => {
  console.log('Conexão estabelecida com', host, 'na porta', port);
  socket.end();
});

socket.on('error', (err) => {
  console.error('Erro de conexão:', err.message);
});
