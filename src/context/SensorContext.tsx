import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://192.168.8.9:3001');
const SensorContext = createContext<any>(null);

export const SensorProvider = ({ children }: { children: React.ReactNode }) => {
  const [dispositivos, setDispositivos] = useState(() => {
    const salvo = localStorage.getItem('@Locatech:sensores');
    return salvo ? JSON.parse(salvo) : {
      esp1: { id: 'esp1', temp: 0, humi: 0, fogo: false, stock: 0 },
      esp2: { id: 'esp2', temp: 0, humi: 0, gas: false, fogo: false, stock: 0 }
    };
  });

  useEffect(() => {
    socket.on('monitoramento_update', (novoDado: any) => {
      if (!novoDado || !novoDado.id) return;
      setDispositivos((prev: any) => {
        const anterior = prev[novoDado.id] || { stock: 0 };
        let stockFinal = novoDado.stock;
        if (novoDado.id === 'esp1' && novoDado.stock === 0 && anterior.stock > 0) {
          stockFinal = anterior.stock;
        }
        const novoEstado = { ...prev, [novoDado.id]: { ...anterior, ...novoDado, stock: stockFinal } };
        localStorage.setItem('@Locatech:sensores', JSON.stringify(novoEstado));
        return novoEstado;
      });
    });
    return () => { socket.off('monitoramento_update'); };
  }, []);

  return (
    <SensorContext.Provider value={{ dispositivos }}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensores = () => {
  const context = useContext(SensorContext);
  if (!context) return { dispositivos: { esp1: { temp: 0, humi: 0, stock: 0 }, esp2: { temp: 0, humi: 0, stock: 0 } } };
  return context;
};