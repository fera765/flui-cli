const createChalkMock = () => {
  const chainable: any = {};
  
  const colors = [
    'cyan', 'bold', 'gray', 'white', 'green', 
    'yellow', 'red', 'blue', 'magenta', 'dim', 
    'black', 'bgGreen', 'bgRed', 'bgBlue',
    'cyanBright', 'blueBright', 'greenBright', 'yellowBright',
    'redBright', 'magentaBright', 'blackBright', 'whiteBright'
  ];
  
  colors.forEach(color => {
    chainable[color] = jest.fn((text: string) => text);
    // Make each color chainable
    colors.forEach(innerColor => {
      chainable[color][innerColor] = jest.fn((text: string) => text);
    });
  });

  return chainable;
};

const chalk = createChalkMock();

export default chalk;