import React, { useState } from 'react';
import { Volume2, X } from 'lucide-react';
import {
  COINS_SPRITE_URL,
  HK_COINS,
  HK_NOTES,
  HKCurrencyItem,
  NOTES_SPRITE_URL,
} from '../data/hkCurrency';
import { HKMoneyVisual } from './HKMoneyVisual';
import { soundEngine } from '../lib/sound';

interface CurrencyGuideModalProps {
  open: boolean;
  onClose: () => void;
}

export const CurrencyGuideModal: React.FC<CurrencyGuideModalProps> = ({ open, onClose }) => {
  const [tab, setTab] = useState<'coins' | 'notes' | 'sheets'>('coins');
  const [selected, setSelected] = useState<HKCurrencyItem>(HK_COINS[3]);

  if (!open) return null;

  const inspectItem = (item: HKCurrencyItem) => {
    setSelected(item);
    if (item.kind === 'coin') {
      soundEngine.playCoinClink(item.cents);
    } else {
      soundEngine.playNoteRustle();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="香港貨幣圖鑑"
    >
      <div className="bg-[#FAF7F2] w-full max-w-4xl max-h-[88vh] rounded-2xl border border-stone-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-stone-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-stone-900">香港貨幣圖鑑</h2>
            <p className="text-xs text-stone-500">認識 7 款香港硬幣與 5 款常見紙幣的顏色、形狀及面額</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-900 cursor-pointer"
            aria-label="關閉圖鑑"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Filter Controls */}
        <div className="px-6 pt-4 flex items-center gap-2">
          <div className="inline-flex p-1 bg-stone-200/75 rounded-xl gap-1">
            {[
              { id: 'coins', label: '香港硬幣 (7款)' },
              { id: 'notes', label: '香港紙幣 (5款)' },
              { id: 'sheets', label: '實物對照原圖' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id as 'coins' | 'notes' | 'sheets');
                  if (item.id === 'coins') setSelected(HK_COINS[3]);
                  if (item.id === 'notes') setSelected(HK_NOTES[0]);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  tab === item.id
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {tab === 'sheets' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-2">
                <h3 className="text-sm font-bold text-stone-800">香港流通硬幣圖譜</h3>
                <img
                  src={COINS_SPRITE_URL}
                  alt="香港流通硬幣圖譜：拾圓、伍圓、貳圓、壹圓、伍毫、貳毫、壹毫"
                  referrerPolicy="no-referrer"
                  className="w-full rounded-lg border border-stone-100 bg-white p-2 object-contain"
                />
                <p className="text-xs text-stone-500 leading-relaxed">
                  包含金銀雙色 10元、銀色 5元 / 2元（波浪邊）/ 1元，以及金黃色 5毫 / 2毫（波浪邊）/ 1毫。
                </p>
              </div>
              <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-2 flex flex-col items-center">
                <h3 className="text-sm font-bold text-stone-800 self-start">香港流通紙幣圖譜</h3>
                <img
                  src={NOTES_SPRITE_URL}
                  alt="香港流通紙幣圖譜：壹仟元、伍佰元、壹佰元、伍拾元、貳拾元"
                  referrerPolicy="no-referrer"
                  className="max-h-[340px] rounded-lg border border-stone-100 object-contain"
                />
                <p className="text-xs text-stone-500 leading-relaxed self-start">
                  面額越大的紙幣尺寸越闊：20元（藍）、50元（綠）、100元（紅）、500元（啡）、1000元（金橙）。
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Highlight Spotlight */}
              <div className="hk-felt-mat rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5 text-white">
                <div className="shrink-0">
                  <HKMoneyVisual id={selected.id} size="lg" />
                </div>
                <div className="text-center sm:text-left space-y-1.5">
                  <div className="text-xs font-medium text-emerald-200">
                    {selected.englishName} · {selected.kind === 'coin' ? '香港硬幣' : '香港紙幣'}
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-tight">
                    {selected.chineseName}{' '}
                    <span className="text-amber-300 font-mono-num">{selected.spokenName}</span>
                  </h3>
                  <p className="text-sm text-emerald-50/90 leading-relaxed">{selected.colorHint}</p>
                  <button
                    type="button"
                    onClick={() => inspectItem(selected)}
                    className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>再聽一次音效</span>
                  </button>
                </div>
              </div>

              {/* Interactive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(tab === 'coins' ? HK_COINS : HK_NOTES).map((item) => {
                  const active = selected.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => inspectItem(item)}
                      className={`p-3.5 rounded-xl border-2 bg-white flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                        active
                          ? 'border-emerald-600 shadow-sm bg-emerald-50/40'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <HKMoneyVisual id={item.id} size="sm" />
                      <div className="text-center">
                        <div className="text-sm font-extrabold text-stone-900 font-mono-num">
                          {item.shortLabel}
                        </div>
                        <div className="text-xs text-stone-500">{item.chineseName}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
