export const marked: any = jest.fn((text: string) => text);

marked.setOptions = jest.fn();
marked.parseInline = jest.fn((text: string) => text);

export default marked;