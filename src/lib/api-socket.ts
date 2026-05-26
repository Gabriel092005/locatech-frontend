import { io, Socket } from 'socket.io-client';

export const apiSocket: Socket = io('http://localhost:3001', { autoConnect: true });

type NotifData = { content: string; created_at: string };
type ConviteData = { id: number; de_user: { nome: string }; comunidade: { nome: string } };

const novaNotificacaoListeners: Set<(data: NotifData) => void> = new Set();
const conviteRecebidoListeners: Set<(data: ConviteData) => void> = new Set();

export function onNovaNotificacao(fn: (data: NotifData) => void) {
  novaNotificacaoListeners.add(fn);
  return () => { novaNotificacaoListeners.delete(fn); };
}

export function onConviteRecebido(fn: (data: ConviteData) => void) {
  conviteRecebidoListeners.add(fn);
  return () => { conviteRecebidoListeners.delete(fn); };
}

apiSocket.on('connect', () => {
  console.log('✅ apiSocket conectado a localhost:3001');
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('📡 Registando apiSocket com userId:', payload.id);
      apiSocket.emit('register', payload.id);
    } catch {
      console.error('❌ Erro ao descodificar JWT para socket');
    }
  }
});

apiSocket.on('connect_error', (err) => console.error('❌ apiSocket erro:', err.message));
apiSocket.on('disconnect', (reason) => console.log('🔌 apiSocket desconectado:', reason));

apiSocket.on('nova_notificacao', (data: NotifData) => {
  console.log('🔔 nova_notificacao recebida:', data.content);
  novaNotificacaoListeners.forEach((fn) => fn(data));
});

apiSocket.on('convite_recebido', (data: ConviteData) => {
  console.log('📨 convite_recebido recebido:', data.de_user.nome);
  conviteRecebidoListeners.forEach((fn) => fn(data));
});
