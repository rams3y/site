import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Send, 
  MessageCircle, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { LifecellNumber } from '../types';

interface NumberCardProps {
  item: LifecellNumber;
  onCopyNumber: (formatted: string) => void;
}

export const NumberCard: React.FC<NumberCardProps> = ({
  item,
  onCopyNumber,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(item.formatted);
    setCopied(true);
    onCopyNumber(item.formatted);
    setTimeout(() => setCopied(false), 2000);
  };

  // Operator style
  const getOperatorBadge = () => {
    if (item.operator === 'kyivstar') {
      return {
        label: 'Київстар',
        badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        prefixColor: 'text-sky-400',
        dotColor: 'bg-sky-400'
      };
    }
    if (item.operator === 'vodafone') {
      return {
        label: 'Vodafone',
        badgeClass: 'bg-red-500/20 text-red-300 border-red-500/30',
        prefixColor: 'text-red-400',
        dotColor: 'bg-red-400'
      };
    }
    return {
      label: 'Lifecell',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      prefixColor: 'text-amber-400',
      dotColor: 'bg-amber-400'
    };
  };

  const opStyle = getOperatorBadge();

  // Category badge styles
  const getCategoryStyles = () => {
    switch (item.category) {
      case 'vip':
        return {
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
          borderGlow: 'hover:border-blue-500/60',
          numberColor: 'text-blue-300 font-extrabold',
        };
      case 'platinum':
        return {
          badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
          borderGlow: 'hover:border-sky-500/60',
          numberColor: 'text-sky-200 font-extrabold',
        };
      case 'gold':
        return {
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
          borderGlow: 'hover:border-amber-500/60',
          numberColor: 'text-amber-200 font-bold',
        };
      case 'silver':
        return {
          badgeBg: 'bg-zinc-800 text-zinc-200 border-zinc-700',
          borderGlow: 'hover:border-zinc-500',
          numberColor: 'text-zinc-100 font-bold',
        };
      case 'butterfly':
      case 'ladder':
        return {
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
          borderGlow: 'hover:border-purple-500/60',
          numberColor: 'text-purple-200 font-bold',
        };
      case 'thousands':
      case 'mirror':
        return {
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          borderGlow: 'hover:border-emerald-500/60',
          numberColor: 'text-emerald-200 font-bold',
        };
      default:
        return {
          badgeBg: 'bg-[#1a1a1c] text-zinc-300 border-[#333336]',
          borderGlow: 'hover:border-zinc-700',
          numberColor: 'text-white font-bold',
        };
    }
  };

  const styles = getCategoryStyles();

  // Telegram direct message link
  const tgMessage = encodeURIComponent(
    `Вітаю! Хочу купити номер ${opStyle.label}: +38 (${item.formatted}) за ${item.price.toLocaleString()} грн на Rams3y Number.`
  );
  const telegramUrl = `https://t.me/lil_rams3y?text=${tgMessage}`;

  // Viber direct message link
  const viberUrl = `viber://chat?number=%2B380638637717`;

  return (
    <div 
      id={`number-card-${item.id}`}
      className={`group relative bg-[#161618] border border-[#2a2a2c] rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60 ${styles.borderGlow}`}
    >
      {/* Top row: Operator & Category badge */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Operator badge */}
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${opStyle.badgeClass}`}>
              {opStyle.label}
            </span>

            {/* Category badge */}
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${styles.badgeBg}`}>
              {item.categoryName}
            </span>

            {item.badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500 text-white">
                {item.badge}
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 font-medium bg-[#111113] px-2 py-0.5 rounded-md border border-[#222225]">
            <Smartphone className="w-3 h-3 text-blue-400" />
            Фізична SIM
          </span>
        </div>

        {/* Main Phone Number Display */}
        <div className="bg-[#111113] border border-[#222225] rounded-xl p-4 text-center my-3 relative overflow-hidden group-hover:border-[#333336] transition-colors">
          <div className="text-xl sm:text-2xl font-mono-num tracking-wide font-extrabold flex items-center justify-center gap-1.5">
            <span className={`${opStyle.prefixColor} font-bold`}>{item.formatted.slice(0, 3)}</span>
            <span className={`${styles.numberColor}`}>{item.formatted.slice(3)}</span>
          </div>

          {/* Pattern description sub-label */}
          <div className="text-[11px] text-zinc-400 mt-1 font-medium flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400/80" />
            <span>{item.patternType}</span>
          </div>

          {/* Copy button overlay */}
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-[#1a1a1c] text-zinc-400 hover:text-white border border-[#333336] transition-colors cursor-pointer"
            title="Скопіювати номер"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 py-1">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            В наявності (Фізична SIM)
          </span>
          <span className="text-zinc-500 font-mono-num text-[10px]">
            {opStyle.label} ({item.code})
          </span>
        </div>
      </div>

      {/* Bottom section: Clean Price & Direct Purchase Button */}
      <div className="mt-4 pt-3 border-t border-[#222225] space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">Вартість:</span>
            <div className="text-2xl font-black text-white font-mono-num tracking-tight flex items-center gap-1.5">
              <span>{item.price.toLocaleString()}</span>
              <span className="text-sm font-bold text-blue-400">грн</span>
            </div>
          </div>

          <a
            href={viberUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Написати у Viber: 0638637717"
            className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition-all hover:scale-105"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        </div>

        {/* Direct Buy Button (opens @lil_rams3y on Telegram) */}
        <a
          id={`buy-btn-${item.id}`}
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Купити в Telegram</span>
        </a>
      </div>
    </div>
  );
};
