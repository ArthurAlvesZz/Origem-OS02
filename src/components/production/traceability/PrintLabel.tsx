import React from 'react';
import QRCode from 'react-qr-code';
import { PublicLotTrace } from '../../../domain/types';

interface PrintLabelProps {
  trace: PublicLotTrace;
  size?: 'small' | 'medium';
}

export function PrintLabel({ trace, size = 'small' }: PrintLabelProps) {
  const url = `${window.location.origin}/lote/${trace.publicCode}`;
  
  let roast: any = null;
  try { if (trace.roastInfoJson) roast = JSON.parse(trace.roastInfoJson); } catch (e) {}

  let descriptors: string[] = [];
  try { if (trace.publicDescriptorsJson) descriptors = JSON.parse(trace.publicDescriptorsJson); } catch (e) {}
  
  return (
    <div className={`print-only flex items-center justify-center p-4 bg-white text-black font-sans w-full h-full ${size === 'small' ? 'max-w-[50mm]' : 'max-w-[70mm]'}`}>
      <div className="flex flex-col items-center justify-center w-full text-center border-2 border-black p-2 rounded-xl">
        <h1 className="font-heading font-black text-xl tracking-tighter mb-1 uppercase">COFCOF<span className="text-black/50">.</span>CO</h1>
        
        <div className="mb-2 w-full border-t-2 border-black border-dashed pt-1" />
        
        <h2 className="font-bold text-sm tracking-tight leading-tight line-clamp-2">{trace.title}</h2>
        
        <div className="flex flex-col items-center justify-center my-3" style={{ width: size === 'small' ? 80 : 120, height: size === 'small' ? 80 : 120 }}>
          <QRCode value={url} size={size === 'small' ? 80 : 120} level="M" style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
        </div>
        
        <div className="text-[10px] uppercase font-bold tracking-widest text-black/70 mb-1">
          Lote: {trace.publicCode}
        </div>
        
        {roast && roast.roastLevel && (
           <div className="text-[9px] uppercase font-semibold mb-1">
             Torra {roast.roastLevel}
           </div>
        )}

        {descriptors.length > 0 && (
           <div className="text-[8px] italic leading-tight text-black/80 px-2 line-clamp-2">
              {descriptors.join(', ')}
           </div>
        )}
        
        <div className="mt-2 w-full border-t-2 border-black border-dashed pt-1" />
        <p className="text-[8px] uppercase tracking-wide font-medium mt-1">Escaneie para Rastreabilidade</p>
      </div>
    </div>
  );
}
