const ftest = require('firebase-functions-test')();

const mockGetUserByEmail = jest.fn();
const mockCreateUser = jest.fn();
const mockSetCustomUserClaims = jest.fn();
const mockGetUser = jest.fn();
const mockListUsers = jest.fn();
const mockDeleteUser = jest.fn();

jest.mock('firebase-admin/auth', () => ({
    getAuth: () => ({
        getUserByEmail: mockGetUserByEmail,
        createUser: mockCreateUser,
        setCustomUserClaims: mockSetCustomUserClaims,
        getUser: mockGetUser,
        listUsers: mockListUsers,
        deleteUser: mockDeleteUser,
    }),
}));

jest.mock('firebase-admin/app', () => ({ initializeApp: jest.fn() }));

const myFunctions = require('../index');

const SUPER_ADMIN_UID = 'RnBej9HSStVJXA0rtIB02W0R1yv2';

beforeEach(() => { jest.clearAllMocks(); });
afterAll(() => { ftest.cleanup(); });

describe('createNewVendor', () => {
    test('rejects when email already exists', async () => {
        mockGetUserByEmail.mockResolvedValue({ uid: 'existing-uid' });
        const wrapped = ftest.wrap(myFunctions.createNewVendor);

        await expect(wrapped({
            data: { username: 'alex', password: 'pw1234', class: 'morning' },
            auth: { uid: SUPER_ADMIN_UID, token: { superAdmin: true } },
        })).rejects.toThrow(/already exists/i);

        expect(mockCreateUser).not.toHaveBeenCalled();
    });

    test('creates user when email is free', async () => {
        const notFound = Object.assign(new Error('not found'), { code: 'auth/user-not-found' });
        mockGetUserByEmail.mockRejectedValue(notFound);
        mockCreateUser.mockResolvedValue({ uid: 'new-uid' });
        mockSetCustomUserClaims.mockResolvedValue();

        const wrapped = ftest.wrap(myFunctions.createNewVendor);
        const result = await wrapped({
            data: { username: 'alex', password: 'pw1234', class: 'morning' },
            auth: { uid: SUPER_ADMIN_UID, token: { superAdmin: true } },
        });

        expect(result.success).toBe(true);
        expect(mockCreateUser).toHaveBeenCalledWith({
            email: 'alex@shopnext.dev',
            password: 'pw1234',
            displayName: 'alex',
        });
        expect(mockSetCustomUserClaims).toHaveBeenCalledWith('new-uid', { class: 'morning' });
    });
});

describe('createAvatarVendor', () => {
    test('rejects when email already exists (no claim merging)', async () => {
        mockGetUserByEmail.mockResolvedValue({
            uid: 'existing-uid',
            customClaims: { class: 'morning' },
        });
        const wrapped = ftest.wrap(myFunctions.createAvatarVendor);

        await expect(wrapped({
            data: { username: 'alex', password: 'pw1234', avatarClass: 'morning' },
            auth: { uid: SUPER_ADMIN_UID, token: { superAdmin: true } },
        })).rejects.toThrow(/already exists/i);

        expect(mockCreateUser).not.toHaveBeenCalled();
        expect(mockSetCustomUserClaims).not.toHaveBeenCalled();
    });

    test('creates talent user when email is free', async () => {
        const notFound = Object.assign(new Error('not found'), { code: 'auth/user-not-found' });
        mockGetUserByEmail.mockRejectedValue(notFound);
        mockCreateUser.mockResolvedValue({ uid: 'new-uid' });
        mockSetCustomUserClaims.mockResolvedValue();

        const wrapped = ftest.wrap(myFunctions.createAvatarVendor);
        const result = await wrapped({
            data: { username: 'theo', password: 'pw1234', avatarClass: 'evening' },
            auth: { uid: SUPER_ADMIN_UID, token: { superAdmin: true } },
        });

        expect(result.success).toBe(true);
        expect(mockSetCustomUserClaims).toHaveBeenCalledWith('new-uid', { avatarClass: 'evening' });
    });
});
