'use client';

import { useEffect, useState } from 'react';

import { fetchHelloFromBff } from '../lib/api';

export default function HelloFromBff() {
  const [message, setMessage] = useState<string>('loading...');

  useEffect(() => {
    let cancelled = false;

    fetchHelloFromBff()
      .then((data) => {
        if (!cancelled) setMessage(data.message);
      })
      .catch((err) => {
        if (!cancelled) setMessage(`failed to load: ${String(err)}`);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <p>{message}</p>;
}
