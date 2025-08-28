const chalk = {
  cyan: (text: string) => text,
  bold: (text: string) => text,
  gray: (text: string) => text,
  white: (text: string) => text,
  green: (text: string) => text,
  yellow: (text: string) => text,
  red: (text: string) => text,
  blue: (text: string) => text,
  magenta: (text: string) => text,
  bgGreen: {
    black: (text: string) => text,
  },
  bgRed: {
    white: (text: string) => text,
  },
  dim: (text: string) => text,
};

export default chalk;