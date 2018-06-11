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
        timestampsInSnapshots: true,
    },
    mongoDbConfig: {
        BASE_URL: 'http://localhost:3000/',
        PROJECTS_BASE_URL: 'http://localhost:3000/projects/',
        SIGNUP_BASE_URL: 'http://localhost:3000/auth/signup',
        SIGNIN_BASE_URL: 'http://localhost:3000/auth/signin',
        FIREBASE_SIGNIN_BASE_URL: 'http://localhost:3000/firebase/auth/signin',
        VERIFY_EMAIL_BASE_URL: 'http://localhost:3000/auth/verifyemail/',
        UPDATE_USER_LASTNAME_FIRSTNAME: 'http://localhost:3000/users/updateuser/',

        // DEPARTMENTS_BASE_URL: 'http://localhost:3000/app1/departments/', // URL BUILT directly IN DEPARTMENTS SERVICE
        // FAQKB_BASE_URL: 'http://localhost:3000/app1/faq_kb/', // URL BUILT directly IN FAQ-KB SERVICE
        // FAQ_BASE_URL: 'http://localhost:3000/app1/faq/', // URL BUILT directly IN FAQ SERVICE
        CONTACTS_BASE_URL: 'http://localhost:3000/app1/contacts/',
        BOTS_BASE_URL: 'http://localhost:3000/app1/bots/',
        // PROJECT_USER_BASE_URL: 'http://localhost:3000/app1/project_users/', // NO MORE USED - THE RELATION PROJECT -> PROJECT USER IT'S DONE chat21-api-node.js
        MONGODB_PEOPLE_BASE_URL: 'http://localhost:3000/app1/people/',
        TOKEN: 'JWT [REDACTED_JWT]',
    },
    cloudFunctions: {
        // https://us-central1-<FIREBASE_PROJECT_ID>.cloudfunctions.net/api/<APP_ID>/groups/<GROUP_ID>/members/<MEMBERID>

        cloud_func_close_support_group_base_url: 'https://us-central1-chat-v2-dev.cloudfunctions.net/supportapi/tilechat/groups/',
        cloud_functions_base_url: 'https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/groups/',
        cloud_func_update_firstname_and_lastname: 'https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/contacts/me'
        // firebase_IdToken: 'Bearer [REDACTED_JWT]',
    },
    chat: {
        CHAT_BASE_URL: 'https://support.tiledesk.com/chat/',
    }
};
