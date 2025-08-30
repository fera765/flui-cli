// Mock for marked v4
export const marked: any = jest.fn((text: string) => text);

marked.setOptions = jest.fn();
marked.parseInline = jest.fn((text: string) => text);
marked.use = jest.fn();

export default marked;