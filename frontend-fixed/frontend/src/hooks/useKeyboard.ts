import { useEffect, useRef } from 'react';
import { InputManager, type Direction } from '@/game/input';

export function useKeyboard(onDirection: (d: Direction) => void) {
  const managerRef = useRef<InputManager | null>(null);

  useEffect(() => {
    const manager = new InputManager();
    managerRef.current = manager;
    manager.attach(window);
    const off = manager.onDirection(onDirection);
    return () => { off(); manager.detach(window); };
  }, [onDirection]);

  return {
    press: (d: Direction) => managerRef.current?.press(d),
  };
}