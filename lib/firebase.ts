import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAe3JXG_zrceZjVXHP-VcSJcB69KAspxIE",
  authDomain: "pickaso-ab898.firebaseapp.com",
  projectId: "pickaso-ab898",
  storageBucket: "pickaso-ab898.firebasestorage.app",
  messagingSenderId: "96625687566",
  appId: "1:96625687566:web:ab1827732c09ce8345105f",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
