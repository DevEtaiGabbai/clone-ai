import { Compartment, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode';
import type { EditorSettings } from './CodeMirrorEditor';

export const darkTheme = EditorView.theme({}, { dark: true });
export const themeSelection = new Compartment();

export function getTheme(theme: 'dark' | 'light', settings: EditorSettings = {}): Extension {
  return [
    getEditorTheme(settings),
    theme === 'dark' ? themeSelection.of([getDarkTheme()]) : themeSelection.of([getLightTheme()]),
  ];
}

export function reconfigureTheme(theme: 'dark' | 'light') {
  return themeSelection.reconfigure(theme === 'dark' ? getDarkTheme() : getLightTheme());
}

function getEditorTheme(settings: EditorSettings) {
  return EditorView.theme({
    '&': {
      fontSize: settings.fontSize ?? '12px',
    },
    '&.cm-editor': {
      height: '100%',
      background: 'var(--background)',
      color: 'var(--foreground)',
    },
    '.cm-cursor': {
      borderLeft: '2px solid var(--primary)',
    },
    '.cm-scroller': {
      lineHeight: '1.5',
      '&:focus-visible': {
        outline: 'none',
      },
    },
    '.cm-line': {
      padding: '0 0 0 4px',
    },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
      backgroundColor: 'var(--primary) !important',
      opacity: '0.3',
    },
    '&:not(.cm-focused) > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
      backgroundColor: 'var(--muted)',
      opacity: '0.3',
    },
    '&.cm-focused > .cm-scroller .cm-matchingBracket': {
      backgroundColor: 'rgba(66, 180, 255, 0.3)',
    },
    '.cm-activeLine': {
      background: 'var(--muted)',
    },
    '.cm-gutters': {
      background: 'var(--background)',
      borderRight: 0,
      color: 'var(--muted-foreground)',
    },
    '.cm-gutter': {
      '&.cm-lineNumbers': {
        fontFamily: 'Roboto Mono, monospace',
        fontSize: settings.gutterFontSize ?? settings.fontSize ?? '12px',
        minWidth: '40px',
      },
      '& .cm-activeLineGutter': {
        background: 'transparent',
        color: 'var(--foreground)',
      },
      '&.cm-foldGutter .cm-gutterElement > .fold-icon': {
        cursor: 'pointer',
        color: 'var(--muted-foreground)',
        transform: 'translateY(2px)',
        '&:hover': {
          color: 'var(--foreground)',
        },
      },
    },
    '.cm-foldGutter .cm-gutterElement': {
      padding: '0 4px',
    },
    '.cm-tooltip-autocomplete > ul > li': {
      minHeight: '18px',
    },
    '.cm-panel.cm-search label': {
      marginLeft: '2px',
      fontSize: '12px',
    },
    '.cm-panel.cm-search .cm-button': {
      fontSize: '12px',
    },
    '.cm-panel.cm-search .cm-textfield': {
      fontSize: '12px',
    },
    '.cm-panel.cm-search input[type=checkbox]': {
      position: 'relative',
      transform: 'translateY(2px)',
      marginRight: '4px',
    },
    '.cm-panels': {
      borderColor: 'var(--border)',
    },
    '.cm-panels-bottom': {
      borderTop: '1px solid var(--border)',
      backgroundColor: 'transparent',
    },
    '.cm-panel.cm-search': {
      background: 'var(--background)',
      color: 'var(--muted-foreground)',
      padding: '8px',
    },
    '.cm-search .cm-button': {
      background: 'var(--secondary)',
      borderColor: 'var(--border)',
      color: 'var(--secondary-foreground)',
      borderRadius: '4px',
      '&:hover': {
        color: 'var(--foreground)',
      },
      '&:focus-visible': {
        outline: 'none',
        borderColor: 'var(--ring)',
      },
      '&:hover:not(:focus-visible)': {
        background: 'var(--accent)',
        borderColor: 'var(--accent)',
      },
      '&:hover:focus-visible': {
        background: 'var(--accent)',
        borderColor: 'var(--ring)',
      },
    },
    '.cm-panel.cm-search [name=close]': {
      top: '6px',
      right: '6px',
      padding: '0 6px',
      fontSize: '1rem',
      backgroundColor: 'transparent',
      color: 'var(--muted-foreground)',
      '&:hover': {
        'border-radius': '6px',
        color: 'var(--foreground)',
        backgroundColor: 'var(--accent)',
      },
    },
    '.cm-search input': {
      background: 'var(--background)',
      borderColor: 'var(--border)',
      color: 'var(--foreground)',
      outline: 'none',
      borderRadius: '4px',
      '&:focus-visible': {
        borderColor: 'var(--ring)',
      },
    },
    '.cm-tooltip': {
      background: 'var(--background)',
      border: '1px solid transparent',
      borderColor: 'var(--border)',
      color: 'var(--foreground)',
    },
    '.cm-tooltip.cm-tooltip-autocomplete ul li[aria-selected]': {
      background: 'var(--accent)',
      color: 'var(--accent-foreground)',
    },
    '.cm-searchMatch': {
      backgroundColor: 'rgba(234, 92, 0, 0.33)',
    },
    '.cm-tooltip.cm-readonly-tooltip': {
      padding: '4px',
      whiteSpace: 'nowrap',
      backgroundColor: 'var(--background)',
      borderColor: 'var(--border)',
      '& .cm-tooltip-arrow:before': {
        borderTopColor: 'var(--border)',
      },
      '& .cm-tooltip-arrow:after': {
        borderTopColor: 'transparent',
      },
    },
  });
}

function getLightTheme() {
  return vscodeLight;
}

function getDarkTheme() {
  return vscodeDark;
} 