// Importa as bibliotecas necessárias
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mqtt = require('mqtt');

// --- CONFIGURAÇÕES PRONTAS E ATUALIZADAS ---
const MQTT_BROKER_URL = 'mqtts://iotprojeto-f67e419f.a01.euc1.aws.hivemq.cloud';
const MQTT_OPTIONS = {
  port: 8883,
  username: 'ivan.ssa',
  password: 'Iot_teste123',
  protocolVersion: 4
};
const MQTT_TOPIC = 'meu_projeto/dispositivo/status';
// --- FIM DAS CONFIGURAÇÕES ---

const app = express();
const server = http.createServer(app);
const io = new Server(server);

console.log('Iniciando servidor e tentando conectar ao Broker MQTT...');
const client = mqtt.connect(MQTT_BROKER_URL, MQTT_OPTIONS);

client.on('connect', () => {
  console.log('✅ Sucesso! Conectado ao Broker MQTT com o usuário:', MQTT_OPTIONS.username);
  client.subscribe(MQTT_TOPIC, (err) => {
    if (!err) {
      console.log(`✅ Inscrito no tópico: ${MQTT_TOPIC}`);
    } else {
      console.error('❌ Erro ao se inscrever no tópico:', err);
    }
  });
});

client.on('message', (topic, payload) => {
  const message = payload.toString();
  console.log(`📩 Mensagem recebida: ${message}`);
  // Envia a mensagem para a página web
  io.emit('mqtt_message', {
    topic: topic,
    payload: message
  });
});

client.on('error', (err) => {
    console.error('❌ Erro de conexão MQTT:', err);
});

// O código HTML da sua página
const HTML_PAGE = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard IoT em Tempo Real</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; color: #1a202c; text-align: center; }
        #container { max-width: 700px; margin: 50px auto; padding: 25px; background: white; border-radius: 10px; box-shadow: 0 4px H20px rgba(0,0,0,0.08); }
        h1 { color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        #dados { min-height: 150px; display: flex; align-items: center; justify-content: center; background-color: #edf2f7; padding: 20px; border-radius: 5px; font-family: "Fira Code", "Courier New", monospace; font-size: 1.1em; line-height: 1.6; text-align: left;}
        strong { color: #2b6cb0; }
        small { color: #718096; display: block; margin-top: 15px; }
        .loading-text { color: #a0aec0; }
    </style>
</head>
<body>
    <div id="container">
        <h1>Dashboard IoT - Porto Alegre</h1>
        <div id="dados">
            <p class="loading-text">Aguardando dados do dispositivo...</p>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        const divDados = document.getElementById('dados');

        socket.on('mqtt_message', function(msg) {
            console.log('Nova mensagem do WebSocket:', msg.payload);
            const data = JSON.parse(msg.payload);
            divDados.innerHTML = \`
                <p><strong>ID do Dispositivo:</strong> \${data.device_id || 'N/A'}</p>
                <p><strong>Usuário Conectado:</strong> \${data.user || 'N/A'}</p>
                <p><strong>Endereço IP:</strong> \${data.ip_address || 'N/A'}</p>
                <p><small>Última atualização: \${new Date().toLocaleTimeString('pt-BR')}</small></p>
            \`;
        });
    </script>
</body>
</html>
`;

// Rota principal que entrega a página HTML
app.get('/', (req, res) => {
  res.send(HTML_PAGE);
});

// Inicia o servidor na porta que o Render fornecer
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor web iniciado e ouvindo na porta ${PORT}`);
});
