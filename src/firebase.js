import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
apiKey: "AIzaSyDVZGJFec44YBqLo-raj4wJGpZBsvwfekY",
authDomain: "graminconnect-b6252.firebaseapp.com",
projectId: "graminconnect-b6252",
storageBucket: "graminconnect-b6252.firebasestorage.app",
messagingSenderId: "343640832841",
appId: "1:343640832841:web:c50a39ea76add789387898",
measurementId: "G-CK42LK40VV"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
