import { useState, useEffect, useCallback } from "react";

export type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

type ToastAction = {
  id: string;
} & ToastProps;

let memoryState: ToastAction[] = [];
let listeners: Array<(state: ToastAction[]) => void> = [];

function dispatch(action: ToastAction | { type: "DISMISS"; id: string }) {
  if ("type" in action && action.type === "DISMISS") {
    memoryState = memoryState.filter((t) => t.id !== action.id);
  } else {
    memoryState = [action as ToastAction, ...memoryState];
  }
  listeners.forEach((listener) => listener(memoryState));
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastAction[]>(memoryState);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  const toast = useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    dispatch({ id, ...props });
    
    setTimeout(() => {
      dispatch({ type: "DISMISS", id });
    }, 5000);
  }, []);

  const dismiss = useCallback((id: string) => {
    dispatch({ type: "DISMISS", id });
  }, []);

  return { toast, toasts, dismiss };
}
