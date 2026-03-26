import { useEffect, useState, type ComponentType } from "react";
import { Moon, Sun } from "lucide-react";

import { modules as discoveredModules } from "./.generated/mockup-components";

type ModuleMap = Record<string, () => Promise<Record<string, unknown>>>;

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "mockup_sandbox_theme";

function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";

  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function _resolveComponent(
  mod: Record<string, unknown>,
  name: string,
): ComponentType | undefined {
  const fns = Object.values(mod).filter(
    (v) => typeof v === "function",
  ) as ComponentType[];
  return (
    (mod.default as ComponentType) ||
    (mod.Preview as ComponentType) ||
    (mod[name] as ComponentType) ||
    fns[fns.length - 1]
  );
}

function PreviewRenderer({
  componentPath,
  modules,
}: {
  componentPath: string;
  modules: ModuleMap;
}) {
  const [Component, setComponent] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setComponent(null);
    setError(null);

    async function loadComponent(): Promise<void> {
      const key = `./components/mockups/${componentPath}.tsx`;
      const loader = modules[key];
      if (!loader) {
        setError(`No component found at ${componentPath}.tsx`);
        return;
      }

      try {
        const mod = await loader();
        if (cancelled) {
          return;
        }
        const name = componentPath.split("/").pop()!;
        const comp = _resolveComponent(mod, name);
        if (!comp) {
          setError(
            `No exported React component found in ${componentPath}.tsx\n\nMake sure the file has at least one exported function component.`,
          );
          return;
        }
        setComponent(() => comp);
      } catch (e) {
        if (cancelled) {
          return;
        }

        const message = e instanceof Error ? e.message : String(e);
        setError(`Failed to load preview.\n${message}`);
      }
    }

    void loadComponent();

    return () => {
      cancelled = true;
    };
  }, [componentPath, modules]);

  if (error) {
    return (
      <pre style={{ color: "red", padding: "2rem", fontFamily: "system-ui" }}>
        {error}
      </pre>
    );
  }

  if (!Component) return null;

  return <Component />;
}

function getBasePath(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "");
}

function getPreviewExamplePath(): string {
  const basePath = getBasePath();
  return `${basePath}/preview/ComponentName`;
}

function Gallery() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8 text-foreground">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold mb-3">
          Component Preview Server
        </h1>
        <p className="text-muted-foreground mb-4">
          This server renders individual components for the workspace canvas.
        </p>
        <p className="text-sm text-muted-foreground/60">
          Access component previews at{" "}
          <code className="bg-card px-1.5 py-0.5 rounded text-foreground/70">
            {getPreviewExamplePath()}
          </code>
        </p>
      </div>
    </div>
  );
}

function getPreviewPath(): string | null {
  const basePath = getBasePath();
  const { pathname } = window.location;
  const local =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || "/"
      : pathname;
  const match = local.match(/^\/preview\/(.+)$/);
  return match ? match[1] : null;
}

function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    getInitialThemeMode(),
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", themeMode === "dark");
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  const previewPath = getPreviewPath();

  const toggleTheme = () => {
    setThemeMode((t) => (t === "dark" ? "light" : "dark"));
  };

  if (previewPath) {
    return (
      <div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="fixed top-4 right-4 z-50 inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border/30 bg-background/70 backdrop-blur-md shadow-sm hover:bg-background transition-colors"
        >
          {themeMode === "dark" ? (
            <Sun className="w-4 h-4 text-foreground" />
          ) : (
            <Moon className="w-4 h-4 text-foreground" />
          )}
        </button>

        <PreviewRenderer componentPath={previewPath} modules={discoveredModules} />
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="fixed top-4 right-4 z-50 inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border/30 bg-background/70 backdrop-blur-md shadow-sm hover:bg-background transition-colors"
      >
        {themeMode === "dark" ? (
          <Sun className="w-4 h-4 text-foreground" />
        ) : (
          <Moon className="w-4 h-4 text-foreground" />
        )}
      </button>

      <Gallery />
    </div>
  );
}

export default App;
