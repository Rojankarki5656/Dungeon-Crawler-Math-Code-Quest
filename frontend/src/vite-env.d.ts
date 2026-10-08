/// <reference types="vite/client" />

/**
 * Ambient declarations for Vite's asset pipeline.
 * Without these, TypeScript can't resolve side-effect imports like:
 *   import './index.css'
 *   import logo from './logo.svg'
 */
declare module '*.css' {
  const css: string;
  export default css;
}

declare module '*.scss' {
  const css: string;
  export default css;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  import * as React from 'react';
  const SVGComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default SVGComponent;
}