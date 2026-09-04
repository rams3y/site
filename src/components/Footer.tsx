import React from 'react';
import { Send, MessageCircle, Smartphone, Truck, CreditCard, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="bg-[#0a0a0b] border-t border-[#222225] text-zinc-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/25">
                R
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-extrabold text-white">Rams3y</span>
                  <span className="text-lg font-extrabold text-blue-400">Number</span>
                </div>
                <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Каталог красивих номерів Lifecell</p>
              </div>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-md">
              Ексклюзивний каталог срібних, золотих, платинових та VIP номерів Lifecell (063, 073, 093). Всі стартові пакети — нові фізичні SIM-картки. Відправка Новою Поштою по всій Україні з офіційною оплатою на ФОП.
            </p>
          </div>

          {/* Service features */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Умови та доставка</h4>
            <ul className="space-y-2.5 text-zinc-400">
              <li className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Всі SIM-картки фізичні</span>
              </li>
              <li className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Відправка Новою Поштою</span>
              </li>
              <li className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Офіційна оплата на ФОП</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>100% гарантія безпеки</span>
              </li>
            </ul>
          </div>

          {/* Direct Contacts */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Контакти для замовлення</h4>
            <div className="space-y-2.5">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Telegram (Швидка відповідь):</span>
                <a 
                  href="https://t.me/lil_rams3y" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold text-sm mt-0.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  @lil_rams3y
                </a>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Viber / Телефон:</span>
                <a 
                  href="tel:+380638637717" 
                  className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-mono-num font-bold text-sm mt-0.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  063 863 77 17
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-[#222225] flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} Rams3y Number. Каталог красивих номерів Lifecell (063, 073, 093).
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-[#161618] border border-[#2a2a2c] text-emerald-400 font-bold">Нова Пошта</span>
            <span className="px-2 py-0.5 rounded bg-[#161618] border border-[#2a2a2c] text-purple-400 font-bold">Оплата ФОП</span>
            <span className="px-2 py-0.5 rounded bg-[#161618] border border-[#2a2a2c] text-blue-400 font-bold">Lifecell</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
