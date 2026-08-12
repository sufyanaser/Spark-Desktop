use serde::Serialize;
#[cfg(target_os = "windows")]
use std::{env, path::PathBuf, process::Command};
use tauri::{Emitter, Manager, WindowEvent};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, ShortcutState};

const SHORTCUTS: [&str; 6] = [
    "ctrl+t",
    "ctrl+w",
    "ctrl+tab",
    "ctrl+shift+tab",
    "ctrl+shift+n",
    "ctrl+r",
];

const SPARK_WORKSPACE_LINK_ROUTING_SCRIPT: &str = r#"
(() => {
  if (window.location.origin !== 'https://gemini.google.com') return;

  const isWorkspaceUrl = (value) => {
    try {
      const url = new URL(String(value), window.location.href);
      return url.origin === 'https://drive.google.com' ||
        (url.origin === 'https://docs.google.com' &&
          (url.pathname.startsWith('/document/') || url.pathname.startsWith('/spreadsheets/')));
    } catch {
      return false;
    }
  };

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const anchor = event.target.closest('a[href]');
    if (!anchor || !isWorkspaceUrl(anchor.href)) return;
    anchor.target = '_self';
  }, true);

  const nativeOpen = window.open.bind(window);
  window.open = function(url, target, features) {
    if (url && isWorkspaceUrl(url)) {
      window.location.assign(new URL(String(url), window.location.href).href);
      return window;
    }
    return nativeOpen(url, target, features);
  };
})();
"#;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct OpenUrlRequest {
    url: String,
    source_label: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct TabTitleChanged {
    label: String,
    title: String,
}

fn is_shell_window_label(label: &str) -> bool {
    label == "main" || label.starts_with("window-")
}

fn is_google_workspace_url(url: &tauri::Url) -> bool {
    match url.host_str() {
        Some("drive.google.com") => true,
        Some("docs.google.com") => {
            let path = url.path();
            path.starts_with("/document/") || path.starts_with("/spreadsheets/")
        }
        _ => false,
    }
}

fn is_spark_url(url: &tauri::Url) -> bool {
    url.host_str() == Some("gemini.google.com") && url.path().starts_with("/spark")
}

#[cfg(target_os = "windows")]
fn chrome_install_candidates() -> Vec<PathBuf> {
    ["LOCALAPPDATA", "PROGRAMFILES", "PROGRAMFILES(X86)"]
        .into_iter()
        .filter_map(|name| env::var_os(name).map(PathBuf::from))
        .map(|root| {
            root.join("Google")
                .join("Chrome")
                .join("Application")
                .join("chrome.exe")
        })
        .collect()
}

#[cfg(target_os = "windows")]
fn launch_google_chrome(url: &tauri::Url) -> Result<(), String> {
    for executable in chrome_install_candidates() {
        if executable.is_file() {
            return Command::new(&executable)
                .arg(url.as_str())
                .spawn()
                .map(|_| ())
                .map_err(|error| format!("Google Chrome could not open the link: {error}"));
        }
    }

    const CHROME_REGISTRY_LAUNCH: &str = r#"
& {
  param([string]$TargetUrl)
  $ErrorActionPreference = 'Stop'
  $registryKeys = @(
    'Registry::HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe',
    'Registry::HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe'
  )
  $chrome = $null
  foreach ($key in $registryKeys) {
    $chrome = (Get-ItemProperty -LiteralPath $key -ErrorAction SilentlyContinue).'(default)'
    if ($chrome) { break }
  }
  if (-not $chrome) { throw 'Google Chrome is not installed.' }
  Start-Process -FilePath $chrome -ArgumentList @($TargetUrl)
}
"#;

    let status = Command::new("powershell.exe")
        .args([
            "-NoLogo",
            "-NoProfile",
            "-NonInteractive",
            "-WindowStyle",
            "Hidden",
            "-Command",
            CHROME_REGISTRY_LAUNCH,
        ])
        .arg(url.as_str())
        .status()
        .map_err(|error| format!("Google Chrome could not be located: {error}"))?;

    if status.success() {
        Ok(())
    } else {
        Err("Google Chrome is required to open Google Drive, Docs, and Sheets links.".into())
    }
}

#[cfg(not(target_os = "windows"))]
fn launch_google_chrome(_url: &tauri::Url) -> Result<(), String> {
    Err("Opening Google Workspace links in Chrome is supported on Windows only.".into())
}

#[tauri::command]
fn open_google_workspace_in_chrome(url: String) -> Result<(), String> {
    let parsed_url: tauri::Url = url
        .parse()
        .map_err(|error| format!("Invalid Google Workspace URL: {error}"))?;

    if parsed_url.scheme() != "https" || !is_google_workspace_url(&parsed_url) {
        return Err(
            "Only HTTPS Google Drive, Docs, and Sheets links can be opened externally.".into(),
        );
    }

    launch_google_chrome(&parsed_url)
}

fn register_app_shortcuts(app: &tauri::AppHandle) {
    let shortcuts = app.global_shortcut();
    for shortcut in SHORTCUTS {
        if !shortcuts.is_registered(shortcut) {
            let _ = shortcuts.register(shortcut);
        }
    }
}

fn unregister_app_shortcuts(app: &tauri::AppHandle) {
    let _ = app.global_shortcut().unregister_all();
}

#[tauri::command]
fn reload_webview(app: tauri::AppHandle, label: String) -> Result<(), String> {
    if !label.starts_with("spark-") {
        return Err("Only Spark Desktop tab webviews can be reloaded.".into());
    }

    let webview = app
        .get_webview(&label)
        .ok_or_else(|| format!("Tab webview '{label}' was not found."))?;

    webview.reload().map_err(|error| error.to_string())
}

#[tauri::command]
fn control_window(
    app: tauri::AppHandle,
    window_label: String,
    action: String,
) -> Result<(), String> {
    if !is_shell_window_label(&window_label) {
        return Err("Window control is restricted to Spark Desktop shell windows.".into());
    }

    let window = app
        .get_window(&window_label)
        .ok_or_else(|| format!("Window '{window_label}' was not found."))?;

    match action.as_str() {
        "minimize" => window.minimize(),
        "toggle-maximize" => {
            if window.is_maximized().map_err(|error| error.to_string())? {
                window.unmaximize()
            } else {
                window.maximize()
            }
        }
        "close" => window.destroy(),
        "start-dragging" => window.start_dragging(),
        _ => return Err(format!("Unsupported window action '{action}'.")),
    }
    .map_err(|error| error.to_string())
}

#[tauri::command]
async fn create_shell_window(app: tauri::AppHandle, label: String) -> Result<(), String> {
    if !label.starts_with("window-") {
        return Err("Child shell window labels must start with 'window-'.".into());
    }

    if app.get_window(&label).is_some() {
        return Ok(());
    }

    tauri::WebviewWindowBuilder::new(&app, label, tauri::WebviewUrl::App("index.html".into()))
        .title("Spark Desktop")
        .inner_size(1280.0, 820.0)
        .min_inner_size(840.0, 560.0)
        .resizable(true)
        .decorations(false)
        .center()
        .build()
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn create_tab_webview(
    app: tauri::AppHandle,
    parent_label: String,
    label: String,
    url: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    if !is_shell_window_label(&parent_label) {
        return Err("Tabs can only be attached to Spark Desktop shell windows.".into());
    }

    if !label.starts_with("spark-") {
        return Err("Tab webview labels must start with 'spark-'.".into());
    }

    if app.get_webview(&label).is_some() {
        return Ok(());
    }

    if width <= 0.0 || height <= 0.0 {
        return Err("Tab webview dimensions must be positive.".into());
    }

    let parsed_url: tauri::Url = url
        .parse()
        .map_err(|error| format!("Invalid tab URL '{url}': {error}"))?;

    if parsed_url.scheme() != "https" && parsed_url.scheme() != "http" {
        return Err("Only HTTP(S) URLs can be opened in a Spark Desktop tab.".into());
    }

    let parent = app
        .get_window(&parent_label)
        .ok_or_else(|| format!("Parent window '{parent_label}' was not found."))?;

    let route_workspace_navigation = is_spark_url(&parsed_url);
    let title_window = parent.clone();
    let title_label = label.clone();

    let mut builder =
        tauri::webview::WebviewBuilder::new(label.clone(), tauri::WebviewUrl::External(parsed_url))
            .focused(true)
            .incognito(false)
            .devtools(false)
            .zoom_hotkeys_enabled(true);

    if route_workspace_navigation {
        let popup_window = parent.clone();
        let popup_source_label = label.clone();
        let navigation_window = parent.clone();
        let navigation_source_label = label.clone();

        builder = builder
            .initialization_script(SPARK_WORKSPACE_LINK_ROUTING_SCRIPT)
            .on_new_window(move |new_url, _features| {
                if is_google_workspace_url(&new_url) {
                    let _ = popup_window.emit(
                        "spark-open-google-workspace",
                        OpenUrlRequest {
                            url: new_url.to_string(),
                            source_label: popup_source_label.clone(),
                        },
                    );
                    tauri::webview::NewWindowResponse::Deny
                } else if is_spark_url(&new_url) {
                    let _ = popup_window.emit(
                        "spark-open-url",
                        OpenUrlRequest {
                            url: new_url.to_string(),
                            source_label: popup_source_label.clone(),
                        },
                    );
                    tauri::webview::NewWindowResponse::Deny
                } else {
                    tauri::webview::NewWindowResponse::Allow
                }
            })
            .on_navigation(move |new_url| {
                if is_google_workspace_url(new_url) {
                    let _ = navigation_window.emit(
                        "spark-open-google-workspace",
                        OpenUrlRequest {
                            url: new_url.to_string(),
                            source_label: navigation_source_label.clone(),
                        },
                    );
                    return false;
                }
                true
            });
    }

    builder = builder.on_document_title_changed(move |_webview, title| {
        if !title.trim().is_empty() {
            let _ = title_window.emit(
                "spark-tab-title",
                TabTitleChanged {
                    label: title_label.clone(),
                    title,
                },
            );
        }
    });

    parent
        .add_child(
            builder,
            tauri::LogicalPosition::new(x, y),
            tauri::LogicalSize::new(width, height),
        )
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(|app, shortcut, event| {
                        if event.state != ShortcutState::Pressed {
                            return;
                        }

                        let action = if shortcut.matches(Modifiers::CONTROL, Code::KeyT) {
                            Some("new-tab")
                        } else if shortcut.matches(Modifiers::CONTROL, Code::KeyW) {
                            Some("close-tab")
                        } else if shortcut.matches(Modifiers::CONTROL | Modifiers::SHIFT, Code::Tab)
                        {
                            Some("previous-tab")
                        } else if shortcut.matches(Modifiers::CONTROL, Code::Tab) {
                            Some("next-tab")
                        } else if shortcut
                            .matches(Modifiers::CONTROL | Modifiers::SHIFT, Code::KeyN)
                        {
                            Some("new-window")
                        } else if shortcut.matches(Modifiers::CONTROL, Code::KeyR) {
                            Some("reload-tab")
                        } else {
                            None
                        };

                        if let Some(action) = action {
                            if let Some(window) = app
                                .windows()
                                .into_values()
                                .find(|window| window.is_focused().unwrap_or(false))
                            {
                                let _ = window.emit("spark-shortcut", action);
                            }
                        }
                    })
                    .build(),
            )?;

            register_app_shortcuts(app.handle());
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::Focused(focused) = event {
                let app = window.app_handle();
                if *focused {
                    register_app_shortcuts(app);
                } else {
                    let any_focused = app
                        .windows()
                        .into_values()
                        .any(|candidate| candidate.is_focused().unwrap_or(false));
                    if !any_focused {
                        unregister_app_shortcuts(app);
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            reload_webview,
            control_window,
            open_google_workspace_in_chrome,
            create_shell_window,
            create_tab_webview
        ])
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running Spark Desktop");
}

#[cfg(test)]
mod tests {
    use super::is_google_workspace_url;

    fn parsed(url: &str) -> tauri::Url {
        url.parse().expect("test URL should be valid")
    }

    #[test]
    fn recognizes_google_drive_docs_and_sheets_urls() {
        for url in [
            "https://drive.google.com/file/d/123/view",
            "https://drive.google.com/open?id=123",
            "https://docs.google.com/document/d/123/edit",
            "https://docs.google.com/spreadsheets/d/123/edit",
        ] {
            assert!(is_google_workspace_url(&parsed(url)), "{url}");
        }
    }

    #[test]
    fn rejects_unrelated_or_lookalike_urls() {
        for url in [
            "https://gemini.google.com/spark/abc",
            "https://docs.google.com/presentation/d/123/edit",
            "https://drive.google.com.example.com/file/d/123/view",
            "https://example.com/https://drive.google.com/file/d/123/view",
        ] {
            assert!(!is_google_workspace_url(&parsed(url)), "{url}");
        }
    }
}
