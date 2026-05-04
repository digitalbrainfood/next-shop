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

describe('convertStudentRole', () => {
    test('keepRole=class strips avatarClass', async () => {
        mockGetUser.mockResolvedValue({
            uid: 'target-uid',
            customClaims: { class: 'morning', avatarClass: 'morning' },
        });
        mockSetCustomUserClaims.mockResolvedValue();

        const wrapped = ftest.wrap(myFunctions.convertStudentRole);
        const result = await wrapped({
            data: { uid: 'target-uid', keepRole: 'class' },
            auth: { uid: SUPER_ADMIN_UID, token: { superAdmin: true } },
        });

        expect(result.success).toBe(true);
        expect(mockSetCustomUserClaims).toHaveBeenCalledWith('target-uid', { class: 'morning' });
    });

    test('keepRole=avatarClass strips class', async () => {
        mockGetUser.mockResolvedValue({
            uid: 'target-uid',
            customClaims: { class: 'morning', avatarClass: 'morning' },
        });
        mockSetCustomUserClaims.mockResolvedValue();

        const wrapped = ftest.wrap(myFunctions.convertStudentRole);
        await wrapped({
            data: { uid: 'target-uid', keepRole: 'avatarClass' },
            auth: { uid: SUPER_ADMIN_UID, token: { superAdmin: true } },
        });
        expect(mockSetCustomUserClaims).toHaveBeenCalledWith('target-uid', { avatarClass: 'morning' });
    });

    test('rejects invalid keepRole', async () => {
        const wrapped = ftest.wrap(myFunctions.convertStudentRole);
        await expect(wrapped({
            data: { uid: 'target-uid', keepRole: 'banana' },
            auth: { uid: SUPER_ADMIN_UID, token: { superAdmin: true } },
        })).rejects.toThrow(/keepRole/i);
    });

    test('rejects unauthenticated caller', async () => {
        const wrapped = ftest.wrap(myFunctions.convertStudentRole);
        await expect(wrapped({
            data: { uid: 'target-uid', keepRole: 'class' },
        })).rejects.toThrow(/logged in/i);
    });
});

describe('listDualAccessStudents', () => {
    const buildUsers = () => ({
        users: [
            { uid: 'a', email: 'a@x', displayName: 'a', customClaims: { class: 'morning', avatarClass: 'morning' } },
            { uid: 'b', email: 'b@x', displayName: 'b', customClaims: { class: 'morning' } },
            { uid: 'c', email: 'c@x', displayName: 'c', customClaims: { avatarClass: 'evening' } },
            { uid: 'd', email: 'd@x', displayName: 'd', customClaims: { class: 'evening', avatarClass: 'evening' } },
            { uid: 'e', email: 'e@x', displayName: 'e', customClaims: {} },
        ],
    });

    test('super admin sees all dual-access students', async () => {
        mockListUsers.mockResolvedValue(buildUsers());
        const wrapped = ftest.wrap(myFunctions.listDualAccessStudents);
        const result = await wrapped({
            data: {},
            auth: { uid: SUPER_ADMIN_UID, token: { superAdmin: true } },
        });
        expect(result.users.map(u => u.uid).sort()).toEqual(['a', 'd']);
    });

    test('scope filter restricts to one class', async () => {
        mockListUsers.mockResolvedValue(buildUsers());
        const wrapped = ftest.wrap(myFunctions.listDualAccessStudents);
        const result = await wrapped({
            data: { scope: 'morning' },
            auth: { uid: SUPER_ADMIN_UID, token: { superAdmin: true } },
        });
        expect(result.users.map(u => u.uid)).toEqual(['a']);
    });

    test('teacher sees only students in their class scope', async () => {
        mockListUsers.mockResolvedValue(buildUsers());
        const wrapped = ftest.wrap(myFunctions.listDualAccessStudents);
        const result = await wrapped({
            data: {},
            auth: { uid: 'teacher-uid', token: { class: 'evening' } },
        });
        expect(result.users.map(u => u.uid)).toEqual(['d']);
    });

    test('rejects unauthenticated', async () => {
        const wrapped = ftest.wrap(myFunctions.listDualAccessStudents);
        await expect(wrapped({ data: {} })).rejects.toThrow(/logged in/i);
    });
});
