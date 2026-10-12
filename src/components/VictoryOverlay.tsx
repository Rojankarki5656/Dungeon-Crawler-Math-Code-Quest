import { useEffect } from 'react';
import { useGameStore } from '@/state/store';
import { PixelText } from './pixel/PixelText';

const DISPLAY_MS = 1_800;

export function VictoryOverlay() {
  const victory = useGameStore((s) => s.victory);
  const setVictory = useGameStore((s) => s.setVictory);

  useEffect(() => {
    if (!victory) return;
    const t = setTimeout(() => setVictory(null), DISPLAY_MS);
    return () => clearTimeout(t);
  }, [victory, setVictory]);

  if (!victory) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
         style={{ animation: 'px-pop 220ms steps(6)' }}>
      <div className="absolute inset-0"
           style={{
             background: 'radial-gradient(circle at center, rgba(255,209,102,0.20) 0%, rgba(255,209,102,0.05) 35%, transparent 65%)',
             animation: 'px-victory-fade 1.8s steps(12) forwards',
           }} />

      <div className="relative">
        <div
          className="absolute inset-0 -z-10"
          style={{
            animation: 'px-spin 3.6s linear infinite',
            background: 'repeating-conic-gradient(from 0deg, rgba(255,209,102,0.28) 0deg 6deg, transparent 6deg 18deg)',
            maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 30%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 30%, transparent 70%)',
          }}
        />
        <div className="px-8 py-6 text-center"
             style={{
               background: '#141b2d',
               border: '4px solid #ffd166',
               boxShadow: '0 0 32px rgba(255,209,102,0.55), inset -4px -4px 0 0 #0b0f1a, inset 4px 4px 0 0 #2a3550, 6px 6px 0 0 rgba(0,0,0,0.75)',
             }}>
          <PixelText size="xl" color="#ffd166" className="block px-text-shadow tracking-widest">
            VICTORY!
          </PixelText>
          <div className="mt-4">
            <PixelText size="sm" color="#e8f1ff">{victory.monsterName} DEFEATED</PixelText>
          </div>
          <div className="mt-3 flex items-center justify-center gap-6">
            <div>
              <PixelText size="xs" color="#55678a" className="block">XP</PixelText>
              <PixelText size="lg" color="#4caf50">+{victory.xp}</PixelText>
            </div>
            <div>
              <PixelText size="xs" color="#55678a" className="block">SCORE</PixelText>
              <PixelText size="lg" color="#7fb2ff">{victory.score}</PixelText>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}