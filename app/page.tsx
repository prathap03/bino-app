"use client"; // This directive marks the component for client-side rendering

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'



export default function ApiDocumentationPage() {

    
    const router = useRouter()
    router.push("/api")

  return (
    <></>
  );
}