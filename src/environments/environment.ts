// tslint:disable:max-line-length
export const environment = {
    production: false,
    firebaseConfig: {
        apiKey: '[REDACTED_GOOGLE_KEY]',
        authDomain: 'chat-v2-dev.firebaseapp.com',
        databaseURL: 'https://chat-v2-dev.firebaseio.com',
        projectId: 'chat-v2-dev',
        storageBucket: 'chat-v2-dev.appspot.com',
        messagingSenderId: '77360455507',
    },
    mongoDbConfig: {
        MONGODB_CONTACTS_BASE_URL: 'http://localhost:3000/app1/contacts/',
        MONGODB_DEPARTMENTS_BASE_URL: 'http://localhost:3000/app1/departments/',
        MONGODB_FAQ_BASE_URL: 'http://localhost:3000/app1/faq/',
        TOKEN: 'JWT [REDACTED_JWT]',
    },
};
