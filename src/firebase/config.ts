"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { firebaseConfig } from "./config";

export const firebaseApp =
  typeof window !== "undefined"
    ? getApps().length
      ? getApp()
      : initializeApp(firebaseConfig)
    : null;
