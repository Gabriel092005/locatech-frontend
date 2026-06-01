import React from 'react';

// Esta interface garante que o TypeScript saiba o que esperar
interface TankRowProps {
  tanque: {
    nome: string;
    volume: number;
  };
}

export function TankRow({ tanque }: TankRowProps) {
  
  // Lógica de cores baseada nas tuas regras exatas:
  const getStatusColor = () => {
    const isGas = tanque.nome.includes("Gás");
    
    // Regra para Gás
    if (isGas) {
      if (tanque.volume <= 10) return "bg-red-500";
      if (tanque.volume <= 20) return "bg-amber-400";
      return "bg-green-500";
    }
    
    // Regra para Gasolina/Gasóleo
    if (tanque.volume <= 20) return "bg-red-500";
    if (tanque.volume <= 60) return "bg-amber-400";
    return "bg-green-500";
  };

  const barColor = getStatusColor();

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between text-sm font-medium text-slate-700">
        <span>{tanque.nome}</span>
        <span>{tanque.volume}L</span>
      </div>
      
      {/* Barra de progresso com cor dinâmica */}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${barColor}`} 
          style={{ width: `${Math.min(tanque.volume, 100)}%` }} 
        />
      </div>
    </div>
  );
}