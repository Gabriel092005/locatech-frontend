import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://192.168.8.84:3001');
const SensorContext = createContext<any>(null);

export const SensorProvider = ({ children }: { children: React.ReactNode }) => {
  // Estado dos Dispositivos
  const [dispositivos, setDispositivos] = useState(() => {
    const salvo = localStorage.getItem('@Locatech:sensores');
    return salvo ? JSON.parse(salvo) : {
      esp1: { id: 'esp1', temp: 0, humi: 0, fogo: false, stock: 0 },
      esp2: { id: 'esp2', temp: 0, humi: 0, gas: false, fogo: false, stock: 0 }
    };
  });

  // Estado das Configurações (Importante para a página de definições)
  const [config, setConfig] = useState(() => {
    const salvo = localStorage.getItem('@Locatech:config');
    return salvo ? JSON.parse(salvo) : {
      limiteTemp: 35,
      limiteHumidade: 90,
      limiteCombustivel: 49,
      limiteTempGas: 35,
      limiteHumidadeGas: 90,
      limiteUnidades: 10,
      somAtivado: true
    };
  });

  // Persistir config sempre que mudar
  useEffect(() => {
    localStorage.setItem('@Locatech:config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        socket.emit('register', payload.sub);
      } catch { console.error("❌ Erro ao descodificar JWT para socket"); }
    }
  }, []);

  useEffect(() => {
    socket.on('monitoramento_update', (novoDado: any) => {
      if (!novoDado || !novoDado.id) return;
      setDispositivos((prev: any) => {
        const id = novoDado.id;
        const anterior = prev[id] || { stock: 0 };
        let stockFinal = novoDado.stock;
        if (id === 'esp1' && (novoDado.stock === 0 || novoDado.stock === null) && anterior.stock > 0) {
          stockFinal = anterior.stock;
        }
        const novoEstado = { ...prev, [id]: { ...anterior, ...novoDado, stock: stockFinal } };
        localStorage.setItem('@Locatech:sensores', JSON.stringify(novoEstado));
        return novoEstado;
      });
    });
    return () => { socket.off('monitoramento_update'); };
  }, []);

  return (
    <SensorContext.Provider value={{ dispositivos, config, setConfig }}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensores = () => {
  const context = useContext(SensorContext);
  return context; // Retorna null se estiver fora do Provider
};