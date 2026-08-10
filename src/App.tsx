import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  activateTab,
  closeTabWebview,
  controlCurrentWindow,
  createShellWindow,
  reloadTab,
  resizeTab,
  type WindowControlAction,
} from './lib/webviews';
import { loadWindowState, makeTab, registerWindow, saveWindowState, unregisterWindow } from './lib/storage';
import { runAutoUpdate } from './lib/updater';
import type { OpenUrlRequest, PersistedWindowState, SparkTab, TabTitleChanged, UpdateUiState } from './types';
import './styles.css';

function UpdatePill({ state }: { state: UpdateUiState }) {
  if (state.kind === 'idle' || state.kind === 'current' || state.kind === 'checking') return null;

  if (state.kind === 'downloading') {
    return (
      <button className="update-pill" type="button" disabled>
        Updating{state.percent === null ? '…' : ` ${state.percent}%`}
      </button>
    );
  }

  if (state.kind === 'ready') {
    return (
      <button className="update-pill update-ready" type="button" disabled>
        Applying update…
      </button>
    );
  }

  return (
    <button className="update-pill update-error" type="button" title={state.message} disabled>
      Update error
    </button>
  );
}

export default function App() {
  const appWindow = useMemo(() => getCurrentWindow(), []);
  const windowLabel = appWindow.label;
  const [state, setState] = useState<PersistedWindowState>(() => loadWindowState(windowLabel));
  const [updateState, setUpdateState] = useState<UpdateUiState>({ kind: 'idle' });
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const stateRef = useRef(state);
  const initializedRef = useRef(false);

  const commitState = useCallback(
    (next: PersistedWindowState) => {
      stateRef.current = next;
      setState(next);
      saveWindowState(windowLabel, next);
    },
    [windowLabel],
  );

  const openTab = useCallback(
    async (tab: SparkTab, tabs: SparkTab[], baseState = stateRef.current) => {
      const next: PersistedWindowState = { ...baseState, tabs, activeTabId: tab.id };
      commitState(next);
      setRuntimeError(null);

      try {
        await activateTab(tab, tabs);
      } catch (error) {
        setRuntimeError(error instanceof Error ? error.message : String(error));
      }
    },
    [commitState],
  );

  const addTab = useCallback(async () => {
    const current = stateRef.current;
    const tab = makeTab();
    await openTab(tab, [...current.tabs, tab], current);
  }, [openTab]);

  const addUrlTab = useCallback(
    async (url: string) => {
      if (!/^https?:\/\//i.test(url)) return;
      const current = stateRef.current;
      const tab = makeTab(url);
      await openTab(tab, [...current.tabs, tab], current);
    },
    [openTab],
  );

  const closeTab = useCallback(
    async (tab: SparkTab) => {
      const current = stateRef.current;
      const index = current.tabs.findIndex((item) => item.id === tab.id);

      await closeTabWebview(tab);
      const remaining = current.tabs.filter((item) => item.id !== tab.id);

      if (remaining.length === 0) {
        const replacement = makeTab();
        await openTab(replacement, [replacement], {
          ...current,
          tabs: [replacement],
          activeTabId: replacement.id,
        });
        return;
      }

      const nextActive =
        tab.id === current.activeTabId
          ? remaining[Math.min(Math.max(index, 0), remaining.length - 1)]
          : remaining.find((item) => item.id === current.activeTabId) ?? remaining[0];

      await openTab(nextActive, remaining, current);
    },
    [openTab],
  );

  const toggleTheme = useCallback(() => {
    const current = stateRef.current;
    const nextTheme = current.theme === 'dark' ? 'light' : 'dark';
    commitState({ ...current, theme: nextTheme });
  }, [commitState]);

  const runWindowAction = useCallback(async (action: WindowControlAction) => {
    try {
      await controlCurrentWindow(action);
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  const createNewWindow = useCallback(async () => {
    try {
      await createShellWindow();
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  const beginWindowDrag = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      void runWindowAction('start-dragging');
    },
    [runWindowAction],
  );

  useEffect(() => {
    stateRef.current = state;
    document.documentElement.dataset.theme = state.theme;
    void appWindow.setTheme(state.theme).catch(() => undefined);
  }, [appWindow, state]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    registerWindow(windowLabel);

    const initial = stateRef.current;
    const initialTab = initial.tabs.find((tab) => tab.id === initial.activeTabId) ?? initial.tabs[0];
    void activateTab(initialTab, initial.tabs).catch((error) => {
      setRuntimeError(error instanceof Error ? error.message : String(error));
    });

    void runAutoUpdate(setUpdateState);

    const onResize = () => {
      const current = stateRef.current;
      const active = current.tabs.find((tab) => tab.id === current.activeTabId) ?? current.tabs[0];
      if (active) void resizeTab(active);
    };

    window.addEventListener('resize', onResize);

    let unlistenClose: (() => void) | undefined;
    void appWindow.onCloseRequested(() => {
      unregisterWindow(windowLabel);
    }).then((unlisten) => {
      unlistenClose = unlisten;
    });

    return () => {
      window.removeEventListener('resize', onResize);
      unlistenClose?.();
    };
  }, [appWindow, windowLabel]);

  useEffect(() => {
    let disposed = false;
    let unlistenOpenUrl: (() => void) | undefined;
    let unlistenTitle: (() => void) | undefined;

    void listen<OpenUrlRequest>('spark-open-url', (event) => {
      if (!disposed) void addUrlTab(event.payload.url);
    }).then((unlisten) => {
      if (disposed) unlisten();
      else unlistenOpenUrl = unlisten;
    });

    void listen<TabTitleChanged>('spark-tab-title', (event) => {
      if (disposed) return;
      const title = event.payload.title.trim();
      if (!title) return;
      const current = stateRef.current;
      const target = current.tabs.find((tab) => tab.label === event.payload.label);
      if (!target || target.title === title) return;
      commitState({
        ...current,
        tabs: current.tabs.map((tab) => (tab.label === event.payload.label ? { ...tab, title } : tab)),
      });
    }).then((unlisten) => {
      if (disposed) unlisten();
      else unlistenTitle = unlisten;
    });

    return () => {
      disposed = true;
      unlistenOpenUrl?.();
      unlistenTitle?.();
    };
  }, [addUrlTab, commitState]);

  useEffect(() => {
    let disposed = false;
    let unlistenShortcut: (() => void) | undefined;

    const runShortcut = (action: string) => {
      const current = stateRef.current;
      const active = current.tabs.find((tab) => tab.id === current.activeTabId) ?? current.tabs[0];

      if (action === 'new-tab') {
        void addTab();
        return;
      }

      if (action === 'close-tab' && active) {
        void closeTab(active);
        return;
      }

      if (action === 'new-window') {
        void createNewWindow();
        return;
      }

      if (action === 'reload-tab' && active) {
        void reloadTab(active).catch((error) => {
          setRuntimeError(error instanceof Error ? error.message : String(error));
        });
        return;
      }

      if ((action === 'next-tab' || action === 'previous-tab') && active && current.tabs.length > 1) {
        const currentIndex = current.tabs.findIndex((tab) => tab.id === active.id);
        const direction = action === 'previous-tab' ? -1 : 1;
        const nextIndex = (currentIndex + direction + current.tabs.length) % current.tabs.length;
        const next = current.tabs[nextIndex];
        void openTab(next, current.tabs, current);
      }
    };

    void listen<string>('spark-shortcut', (event) => runShortcut(event.payload)).then((unlisten) => {
      if (disposed) {
        unlisten();
      } else {
        unlistenShortcut = unlisten;
      }
    });

    return () => {
      disposed = true;
      unlistenShortcut?.();
    };
  }, [addTab, closeTab, createNewWindow, openTab]);

  const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId) ?? state.tabs[0];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div
          className="tabs"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) beginWindowDrag(event);
          }}
        >
          {state.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab ${tab.id === activeTab.id ? 'active' : ''}`}
              onClick={() => void openTab(tab, state.tabs)}
              title={tab.title}
            >
              <span className="spark-dot" aria-hidden="true" />
              <span className="tab-title">{tab.title}</span>
              <span
                className="tab-close"
                role="button"
                tabIndex={0}
                aria-label={`Close ${tab.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  void closeTab(tab);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    void closeTab(tab);
                  }
                }}
              >
                ×
              </span>
            </button>
          ))}

          <button className="icon-button new-tab" type="button" aria-label="New tab" onClick={() => void addTab()}>
            +
          </button>
        </div>

        <div
          className="window-drag-area"
          aria-hidden="true"
          onMouseDown={beginWindowDrag}
          onDoubleClick={() => void runWindowAction('toggle-maximize')}
        />

        <div className="top-actions">
          <UpdatePill state={updateState} />
          <button className="action-button" type="button" onClick={() => void createNewWindow()}>
            New window
          </button>
          <button className="icon-button" type="button" aria-label="Toggle theme" onClick={toggleTheme}>
            {state.theme === 'dark' ? '☾' : '☀'}
          </button>
          <div className="window-controls">
            <button type="button" aria-label="Minimize" onClick={() => void runWindowAction('minimize')}>
              —
            </button>
            <button type="button" aria-label="Maximize" onClick={() => void runWindowAction('toggle-maximize')}>
              □
            </button>
            <button className="close-window" type="button" aria-label="Close" onClick={() => void runWindowAction('close')}>
              ×
            </button>
          </div>
        </div>
      </header>

      {runtimeError ? (
        <div className="runtime-error">
          <strong>Spark could not be opened.</strong>
          <span>{runtimeError}</span>
          <button type="button" onClick={() => void activateTab(activeTab, state.tabs)}>
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}
