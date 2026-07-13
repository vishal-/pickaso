"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type DialogType = "alert" | "confirm" | "prompt";

interface DialogState {
  open: boolean;
  type: DialogType;
  title?: string;
  message: string;
  defaultValue?: string;
}

interface DialogContextValue {
  alert: (message: string, title?: string) => Promise<void>;
  confirm: (message: string, title?: string) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string, title?: string) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog() {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error("useDialog must be used inside DialogProvider");
  }

  return context;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    type: "alert",
    message: "",
  });
  const [value, setValue] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  const resolverRef = useRef<((result?: any) => void) | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const close = useCallback(() => {
    setIsClosing(true);

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(() => {
      setDialog((current) => ({
        ...current,
        open: false,
      }));
      setIsClosing(false);
      closeTimerRef.current = null;
    }, 180);
  }, []);

  const alert = useCallback((message: string, title?: string) => {
    return new Promise<void>((resolve) => {
      resolverRef.current = resolve;
      setIsClosing(false);
      setDialog({
        open: true,
        type: "alert",
        message,
        title,
      });
    });
  }, []);

  const confirm = useCallback((message: string, title?: string) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setIsClosing(false);
      setDialog({
        open: true,
        type: "confirm",
        message,
        title,
      });
    });
  }, []);

  const prompt = useCallback((message: string, defaultValue = "", title?: string) => {
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve;
      setValue(defaultValue);
      setIsClosing(false);
      setDialog({
        open: true,
        type: "prompt",
        message,
        title,
        defaultValue,
      });
    });
  }, []);

  const ok = useCallback(() => {
    switch (dialog.type) {
      case "alert":
        resolverRef.current?.();
        break;
      case "confirm":
        resolverRef.current?.(true);
        break;
      case "prompt":
        resolverRef.current?.(value);
        break;
    }

    resolverRef.current = null;
    close();
  }, [close, dialog.type, value]);

  const cancel = useCallback(() => {
    switch (dialog.type) {
      case "confirm":
        resolverRef.current?.(false);
        break;
      case "prompt":
        resolverRef.current?.(null);
        break;
      default:
        resolverRef.current?.();
        break;
    }

    resolverRef.current = null;
    close();
  }, [close, dialog.type]);

  useEffect(() => {
    if (!dialog.open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (dialog.type === "alert") {
          ok();
          return;
        }
        cancel();
        return;
      }

      if (event.key === "Enter" && dialog.type !== "prompt") {
        ok();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [cancel, dialog.open, dialog.type, ok]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  return (
    <DialogContext.Provider value={{ alert, confirm, prompt }}>
      {children}

      {dialog.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            className={`absolute inset-0 bg-slate-950/80 backdrop-blur-sm ${
              isClosing ? "dialog-backdrop-out" : "dialog-backdrop-in"
            }`}
            aria-label="Close dialog"
            onClick={dialog.type === "alert" ? ok : cancel}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialog.title ? "pickaso-dialog-title" : undefined}
            className={`relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-indigo-400/20 bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-2xl shadow-black/60 ${
              isClosing ? "dialog-panel-out" : "dialog-panel-in"
            }`}
          >
            <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: "radial-gradient(circle at top right, rgba(99,102,241,0.18), transparent 45%)" }} />

            <div className="relative">
              {dialog.title && (
                <h2 id="pickaso-dialog-title" className="text-lg font-semibold text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  {dialog.title}
                </h2>
              )}

              <p className={`text-sm text-slate-300 leading-relaxed ${dialog.title ? "mt-2" : "mt-0"}`}>
                {dialog.message}
              </p>

              {dialog.type === "prompt" && (
                <input
                  autoFocus
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") ok();
                    if (event.key === "Escape") cancel();
                  }}
                  className="mt-4 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500/50"
                />
              )}

              <div className="mt-5 flex items-center justify-end gap-2">
                {dialog.type !== "alert" && (
                  <button
                    type="button"
                    onClick={cancel}
                    className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="button"
                  onClick={ok}
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-indigo-400"
                >
                  {dialog.type === "confirm" ? "Confirm" : "OK"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}