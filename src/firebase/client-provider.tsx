"use client";

import { ReactNode, useMemo } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { firebaseConfig } from "./config";
import { FirebaseProvider } from "./provider";

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export default function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const value = useMemo(() => {
    // Initialize Firebase ONLY in the browser
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
    };
  }, []);

  return <FirebaseProvider value={value}>{children}</FirebaseProvider>;
}
