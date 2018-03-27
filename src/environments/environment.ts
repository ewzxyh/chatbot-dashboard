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
        CONTACTS_BASE_URL: 'http://localhost:3000/app1/contacts/',
        // DEPARTMENTS_BASE_URL: 'http://localhost:3000/app1/departments/', // URL BUILT directly IN DEPARTMENTS SERVICE
        // FAQ_BASE_URL: 'http://localhost:3000/app1/faq/', // URL BUILT directly IN FAQ SERVICE
        BOTS_BASE_URL: 'http://localhost:3000/app1/bots/',
        // FAQKB_BASE_URL: 'http://localhost:3000/app1/faq_kb/', // URL BUILT directly IN FAQ-KB SERVICE
        BASE_URL: 'http://localhost:3000/',
        PROJECTS_BASE_URL: 'http://localhost:3000/projects/',
        PROJECT_USER_BASE_URL: 'http://localhost:3000/app1/project_users/',
        SIGNUP_BASE_URL: 'http://localhost:3000/auth/signup',
        SIGNIN_BASE_URL: 'http://localhost:3000/auth/signin',
        MONGODB_PEOPLE_BASE_URL: 'http://localhost:3000/app1/people/',
        FIREBASE_SIGNIN_BASE_URL: 'http://localhost:3000/firebase/auth/signin',

        TOKEN: 'JWT [REDACTED_JWT]',
    },
    cloudFunctions: {
        cloud_functions_base_url: 'https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/groups/',
        // firebase_IdToken: 'Bearer [REDACTED_JWT]',
    },
};
