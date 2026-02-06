"use client";

import React, { ReactNode, createContext, useContext } from "react";
import type { FirebaseApp } from "firebase/app";
import type { Firestore } from "firebase/firestore";
import type { Auth } from "firebase/auth";

/**
 * Firebase context shape
 * NOTE: This file NEVER initializes Firebase.
 * It only PROVIDES already-created instances.
 */
export interface FirebaseContextState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

const FirebaseContext = createContext<FirebaseContextState | null>(null);

/**
 * FirebaseProvider
 * Pure context provider — no side effects, no Firebase init.
 */
export function FirebaseProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: FirebaseContextState;
}) {
  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

/**
 * Hook to access Firebase services
 */
export function useFirebase(): FirebaseContextState {
  const context = useContext(FirebaseContext);

  if (!context) {
    throw new Error("useFirebase must be used inside FirebaseProvider");
  }

  return context;
}

/**
 * Convenience hooks
 */
export function useAuth(): Auth {
  return useFirebase().auth;
}

export function useFirestore(): Firestore {
  return useFirebase().firestore;
}

export function useFirebaseApp(): FirebaseApp {
  return useFirebase().firebaseApp;
}
