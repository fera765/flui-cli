declare const mockOra: jest.Mock<{
    start: jest.Mock<any, any, any>;
    stop: jest.Mock<any, any, any>;
    succeed: jest.Mock<any, any, any>;
    fail: jest.Mock<any, any, any>;
    warn: jest.Mock<any, any, any>;
    info: jest.Mock<any, any, any>;
    text: string;
    color: string;
    spinner: string;
}, [options?: any], any>;
export default mockOra;
//# sourceMappingURL=ora.d.ts.map