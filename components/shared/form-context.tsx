"use client";

import * as React from "react";

// FormDialog publishes server-action field errors here so Field components
// anywhere in the form body can show their own message.
export const FormErrorsContext = React.createContext<
  Record<string, string> | undefined
>(undefined);

export function useFieldError(name?: string) {
  const errors = React.useContext(FormErrorsContext);
  if (!name || !errors) return undefined;
  return errors[name];
}
