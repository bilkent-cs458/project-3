// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
const mockGeolocation = {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn()
};

global.navigator.geolocation = mockGeolocation;

global.navigator.permissions = {
    query: jest
        .fn()
        .mockImplementation(() => Promise.resolve({ state: 'granted' })),
};

const mockEnqueue = jest.fn();

jest.mock('notistack', () => ({
    ...jest.requireActual('notistack'),
    useSnackbar: () => {
        return {
            enqueueSnackbar: mockEnqueue
        };
    }
}));

