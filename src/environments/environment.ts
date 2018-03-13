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
        MONGODB_BOTS_BASE_URL: 'http://localhost:3000/app1/bots/',
        MONGODB_FAQKB_BASE_URL: 'http://localhost:3000/app1/faq_kb/',
        MONGODB_PROJECTS_BASE_URL: 'http://localhost:3000/app1/projects/',
        MONGODB_SIGNUP_BASE_URL: 'http://localhost:3000/auth/signup',
        MONGODB_PEOPLE_BASE_URL: 'http://localhost:3000/app1/people/',
        TOKEN: 'JWT [REDACTED_JWT]',
    },
    cloudFunctions: {
        cloud_functions_base_url: 'https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/groups/',
        // firebase_IdToken: 'Bearer [REDACTED_JWT]',
    },
};
