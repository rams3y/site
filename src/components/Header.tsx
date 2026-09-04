import React from 'react';
import { 
  Send, 
  MessageCircle, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Smartphone,
  Phone,
  Lock
} from 'lucide-react';

interface HeaderProps {
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAdmin }) => {
  return (
    <header className="sticky top-0 z-40 bg-[#111113]/95 backdrop-blur-md border-b border-[#222225]">
      {/* Top micro banner with key terms */}
      <div className="bg-gradient-to-r from-blue-950/40 via-[#111113] to-blue-950/40 border-b border-[#222225] py-2 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 text-zinc-300 font-medium text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
              <Smartphone className="w-3.5 h-3.5" />
              Всі SIM-картки фізичні
            </span>
            <span className="text-zinc-700 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 text-zinc-400 hidden sm:inline-flex">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              Відправка Новою Поштою по всій Україні
            </span>
            <span className="text-zinc-700 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 text-zinc-400 hidden md:inline-flex">
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
              Офіційна оплата на рахунок ФОП
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <a 
              href="https://t.me/lil_rams3y" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              @lil_rams3y
            </a>
            <span className="text-zinc-700">|</span>
            <a 
              href="tel:+380638637717" 
              className="text-purple-400 hover:text-purple-300 font-mono-num font-semibold flex items-center gap-1"
            >
              <Phone className="w-3 h-3" />
              063 863 77 17
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        <div className="flex items-center">
          {/* Invisible Admin Button strictly to the left of the logo and letter R */}
          <button
            id="invisible-admin-btn"
            onClick={onOpenAdmin}
            title=""
            aria-label="Admin Trigger"
            className="w-8 h-12 -mr-2 opacity-0 hover:opacity-0 focus:opacity-0 focus:outline-none cursor-pointer bg-transparent border-none select-none z-10"
            tabIndex={-1}
          />

          {/* Brand logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/25 transition-transform group-hover:scale-105">
              R
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white">Rams3y</span>
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-blue-400">Number</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase">Каталог красивих номерів</span>
            </div>
          </a>
        </div>

        {/* Messengers CTA Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a 
            href="viber://chat?number=%2B380638637717" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-[#1a1a1c] hover:bg-[#222225] text-purple-400 hover:text-purple-300 border border-[#333336] text-xs font-bold transition-all hover:border-purple-500/40"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Viber:</span>
            <span className="font-mono-num">063 863 77 17</span>
          </a>

          <a 
            id="header-telegram-btn"
            href="https://t.me/lil_rams3y" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:scale-102 active:scale-98 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Telegram @lil_rams3y</span>
          </a>
        </div>
      </div>
    </header>
  );
};

