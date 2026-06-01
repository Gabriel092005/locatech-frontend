import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://192.168.8.112:3001');
const SensorContext = createContext<any>(null);

export const SensorProvider = ({ children }: { children: React.ReactNode }) => {
  const [dispositivos, setDispositivos] = useState(() => {
    const salvo = localStorage.getItem('@Locatech:sensores');
    return salvo ? JSON.parse(salvo) : {
      esp1: { id: 'esp1', temp: 0, humi: 0, fogo: false, stock: 0, isCritico: false },
      esp2: { id: 'esp2', temp: 0, humi: 0, gas: false, fogo: false, stock: 0, isCritico: false }
    };
  });

  const [config, setConfig] = useState(() => {
    const salvo = localStorage.getItem('@Locatech:config');
    return salvo ? JSON.parse(salvo) : {
      limiteTemp: 35,
      limiteHumidade: 90,
      limiteCombustivel: 20,
      limiteTempGas: 35,
      limiteHumidadeGas: 90,
      limiteUnidades: 20,
      somAtivado: true
    };
  });

  // Estado global para guardar as ocorrências ativas
  const [ocorrencias, setOcorrencias] = useState<string[]>([]);
  const [temNotificacaoNova, setTemNotificacaoNova] = useState(false);

  // Trincos para evitar repetição infinita do som
  const alertadoEsp1 = useRef(false);
  const alertadoEsp2 = useRef(false);

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

  // MOTOR DE PROCESSAMENTO DE ALERTAS SONOROS
  useEffect(() => {
    const novasOcorrencias: string[] = [];

    // Função interna isolada para garantir a reprodução estável do som
    const dispararSomAlerta = () => {
      if (!config.somAtivado) return;
      try {
        const audio = new Audio('/sounds/alert.mp3');
        audio.play().catch(e => console.log("⚠️ Áudio retido pelo navegador. Clique na página para ativar:", e));
      } catch (err) {
        console.error("Erro ao reproduzir ficheiro de áudio:", err);
      }
    };

    // Validar Tanque Gasolina (ESP1)
    if (dispositivos.esp1?.isCritico) {
      novasOcorrencias.push('esp1_critico');
      if (!alertadoEsp1.current) {
        dispararSomAlerta();
        alertadoEsp1.current = true;
        setTemNotificacaoNova(true);
      }
    } else {
      alertadoEsp1.current = false;
    }

    // Validar Stock Laranja Gás (ESP2)
    if (dispositivos.esp2?.isCritico) {
      novasOcorrencias.push('esp2_critico');
      if (!alertadoEsp2.current) {
        dispararSomAlerta(); // Corrigido o erro de sintaxe do áudio aqui!
        alertadoEsp2.current = true;
        setTemNotificacaoNova(true);
      }
    } else {
      alertadoEsp2.current = false;
    }

    setOcorrencias(novasOcorrencias);
  }, [dispositivos, config.somAtivado]);

  // ESCUTA ATUALIZAÇÕES DO SOCKET E COMPARA COM OS LIMITES ATUAIS
  useEffect(() => {
    socket.on('monitoramento_update', (novoDado: any) => {
      if (!novoDado || !novoDado.id) return;
      
      setDispositivos((prev: any) => {
        const id = novoDado.id;
        const anterior = prev[id] || { stock: 0 };
        const stockFinal = Number(novoDado.stock || 0);
        
        let estaEmEstadoCritico = false;

        // Garante conversão estrita para número evitando falhas de comparação de strings
        if (id === 'esp1') {
          const limite = Number(config.limiteCombustivel || 20);
          if (stockFinal >= 0 && stockFinal <= limite) {
            estaEmEstadoCritico = true;
          }
        } else if (id === 'esp2') {
          const limiteUnidades = Number(config.limiteUnidades || 20);
          if (stockFinal <= limiteUnidades) {
            estaEmEstadoCritico = true;
          }
        }
        
        const novoEstado = { 
          ...prev, 
          [id]: { 
            ...anterior, 
            ...novoDado, 
            stock: stockFinal, 
            isCritico: estaEmEstadoCritico 
          } 
        };
        
        localStorage.setItem('@Locatech:sensores', JSON.stringify(novoEstado));
        return novoEstado;
      });
    });
    
    return () => { socket.off('monitoramento_update'); };
  }, [config]);

  return (
    <SensorContext.Provider value={{ 
      dispositivos, 
      config, 
      setConfig, 
      ocorrencias, 
      temNotificacaoNova, 
      setTemNotificacaoNova 
    }}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensores = () => useContext(SensorContext);