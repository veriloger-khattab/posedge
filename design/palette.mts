// The raw palette: every hex value in Posedge starts here.
// Change a value, run `npm run build`, and every theme, icon and test follows.
//
// Hues are shared by the dark variants; Daylight deepens them to read on paper (same hue families,
// lower lightness). Surfaces and ink (UI text) are per variant.
// `roles.mts` turns these into the semantic color language.

export type VariantId = 'graphite' | 'midnight' | 'daylight' | 'highContrast';

/** The syntax hues. Four of them are the user's original picks (marked). */
export interface SyntaxHues {
  keyword: string; // user pick #FF6B3A
  macro: string; // user pick #FD9720
  type: string; // user pick #48E0FD
  function: string; // user pick #2BE98A
  string: string;
  number: string;
  time: string;
  verification: string;
  modifier: string; // qualifiers: virtual, pure, local, static, input, this, super
  error: string;
  warning: string;
  ignore: string;
}

export interface Surfaces {
  editor: string;
  sidebar: string;
  panel: string;
  chrome: string; // activity bar, title bar, status bar
  widget: string; // hovers, suggest, find widget
  input: string;
  hover: string;
  active: string;
  border: string;
  borderStrong: string;
  lineHighlight: string;
  selection: string;
}

export interface Ink {
  fg: string; // identifiers and default text
  bright: string;
  muted: string; // secondary UI text
  subtle: string; // inactive UI text
  faint: string; // line numbers, disabled
  comment: string; // user pick #696D70 (Midnight, Daylight); lifted in Graphite for >= 4:1
  operator: string;
  punctuation: string;
  label: string;
}

export interface Variant {
  id: VariantId;
  name: string;
  file: string;
  uiTheme: 'vs' | 'vs-dark' | 'hc-black';
  type: 'light' | 'dark' | 'hc';
  accent: string; // text and thin lines: cursor, focus rings, active line number, the clock
  accentFill: string; // filled surfaces and tints: buttons, badges, selected rows, find matches
  surface: Surfaces;
  ink: Ink;
  syntax: SyntaxHues;
}

export const HUES: SyntaxHues = {
  keyword: '#FF6B3A',
  macro: '#FD9720',
  type: '#48E0FD',
  function: '#2BE98A',
  string: '#AEC359',
  number: '#BD93F9',
  time: '#5C9DFF',
  verification: '#5EC4B6',
  modifier: '#E3C68F',
  error: '#FD3974',
  warning: '#FFD23F',
  ignore: '#7FA8A2',
};

// The same hue families, deepened to clear 4.5:1 on paper. Warm hues crowd together at this lightness,
// so lightness and hue do the separating: warning is a dark gold (a true yellow cannot be read on
// white), string a deep olive, darker than everything else, so it stays clear of both warning and
// function even for colour-blind readers. Chroma is capped because full sRGB purple, blue and magenta
// look electric on paper. Checked by build/validate.mts.
export const DAYLIGHT_HUES: SyntaxHues = {
  keyword: '#D02A10',
  macro: '#AF5A00',
  type: '#027897',
  function: '#157648',
  string: '#424D00',
  number: '#844AD3',
  time: '#1A5CD0',
  verification: '#045255',
  modifier: '#6D4204',
  error: '#D3206A',
  warning: '#7B6300',
  ignore: '#4F7673',
};

export const ACCENT = '#FD9720';
export const DAYLIGHT_ACCENT = '#9F5400'; // #FD9720 is only 2:1 on paper: too faint for a cursor or text

export const VARIANTS: Record<VariantId, Variant> = {
  graphite: {
    id: 'graphite',
    name: 'Posedge Graphite',
    file: 'posedge-graphite',
    uiTheme: 'vs-dark',
    type: 'dark',
    accent: ACCENT,
    accentFill: ACCENT,
    surface: {
      editor: '#1C1C1C',
      sidebar: '#181818',
      panel: '#181818',
      chrome: '#141414',
      widget: '#202020',
      input: '#232323',
      hover: '#262626',
      active: '#2D2D2D',
      border: '#2A2A2A',
      borderStrong: '#3A3A3A',
      lineHighlight: '#232323',
      selection: '#2B4A6A',
    },
    ink: {
      fg: '#D4D7DB',
      bright: '#F0F2F4',
      muted: '#9AA0A6',
      subtle: '#6E7378',
      faint: '#4E5359',
      comment: '#767B80',
      operator: '#B0B6BD',
      punctuation: '#8E949A',
      label: '#B5BAC0',
    },
    syntax: { ...HUES },
  },

  midnight: {
    id: 'midnight',
    name: 'Posedge Midnight',
    file: 'posedge-midnight',
    uiTheme: 'vs-dark',
    type: 'dark',
    accent: ACCENT,
    accentFill: ACCENT,
    surface: {
      editor: '#0F0F0F',
      sidebar: '#0B0B0B',
      panel: '#0B0B0B',
      chrome: '#080808',
      widget: '#161616',
      input: '#181818',
      hover: '#1B1B1B',
      active: '#232323',
      border: '#222222',
      borderStrong: '#303030',
      lineHighlight: '#171717',
      selection: '#233F5C',
    },
    ink: {
      fg: '#CDD0D4',
      bright: '#ECEEF0',
      muted: '#959BA1',
      subtle: '#63686D',
      faint: '#44494E',
      comment: '#696D70',
      operator: '#A8AEB5',
      punctuation: '#858B91',
      label: '#ADB2B8',
    },
    syntax: { ...HUES },
  },

  daylight: {
    id: 'daylight',
    name: 'Posedge Daylight',
    file: 'posedge-daylight',
    uiTheme: 'vs',
    type: 'light',
    accent: DAYLIGHT_ACCENT,
    accentFill: ACCENT,
    // Warm paper, not white: the same ramp as the dark variants, receding toward the window edge.
    surface: {
      editor: '#FBFAF7',
      sidebar: '#F5F4F0',
      panel: '#F5F4F0',
      chrome: '#EDECE7',
      widget: '#FFFFFF',
      input: '#FFFFFF',
      hover: '#EBEAE5',
      active: '#E1E0DA',
      border: '#E0DFD9',
      borderStrong: '#C9C8C1',
      lineHighlight: '#F3F2ED',
      selection: '#C8DDF5',
    },
    ink: {
      fg: '#25282C',
      bright: '#0F1113',
      muted: '#565B61',
      subtle: '#6E7378',
      faint: '#8A8F95',
      comment: '#696D70',
      operator: '#484D53',
      punctuation: '#62676D',
      label: '#474C52',
    },
    syntax: { ...DAYLIGHT_HUES },
  },

  highContrast: {
    id: 'highContrast',
    name: 'Posedge High Contrast',
    file: 'posedge-high-contrast',
    uiTheme: 'hc-black',
    type: 'hc',
    accent: ACCENT,
    accentFill: ACCENT,
    surface: {
      editor: '#000000',
      sidebar: '#000000',
      panel: '#000000',
      chrome: '#000000',
      widget: '#0A0A0A',
      input: '#000000',
      hover: '#1F1F1F',
      active: '#2A2A2A',
      border: '#6E7378',
      borderStrong: '#9AA0A6',
      lineHighlight: '#000000',
      selection: '#1E5A8C',
    },
    ink: {
      fg: '#FFFFFF',
      bright: '#FFFFFF',
      muted: '#D0D4D8',
      subtle: '#B0B6BC',
      faint: '#8A9096',
      comment: '#9DA3A9',
      operator: '#E6E9EC',
      punctuation: '#C9CED3',
      label: '#D6DADE',
    },
    // On pure black every hue clears 7:1 except error and ignore, which are lifted.
    syntax: { ...HUES, error: '#FF5D84', ignore: '#A6CFC9' },
  },
};

export const VARIANT_IDS = Object.keys(VARIANTS) as VariantId[];
