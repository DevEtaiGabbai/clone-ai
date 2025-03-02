import type { ITheme } from '@xterm/xterm';

export function getTerminalTheme(overrides: Partial<ITheme> = {}): ITheme {
  return {
    foreground: '#c9d1d9',
    background: '#0d1117',
    cursor: '#c9d1d9',
    cursorAccent: '#0d1117',
    selectionBackground: '#2d3139',
    black: '#0d1117',
    red: '#ff7b72',
    green: '#3fb950',
    yellow: '#d29922',
    blue: '#58a6ff',
    magenta: '#bc8cff',
    cyan: '#76e3ea',
    white: '#c9d1d9',
    brightBlack: '#6e7681',
    brightRed: '#ffa198',
    brightGreen: '#56d364',
    brightYellow: '#e3b341',
    brightBlue: '#79c0ff',
    brightMagenta: '#d2a8ff',
    brightCyan: '#b3f0ff',
    brightWhite: '#f0f6fc',
    ...overrides
  };
} 