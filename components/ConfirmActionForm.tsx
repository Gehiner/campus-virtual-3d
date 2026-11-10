"use client";

import type { FormEvent, ReactNode } from "react";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
  className?: string;
  message: string;
};

export default function ConfirmActionForm({ action, children, className, message }: Props) {
  function confirmAction(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(message)) event.preventDefault();
  }

  return <form action={action} className={className} onSubmit={confirmAction}>{children}</form>;
}
