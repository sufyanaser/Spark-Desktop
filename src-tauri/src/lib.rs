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
        return Err("Only Spark tab webviews can be reloaded.".into());
    }

    let webview = app
        .get_webview(&label)
        .ok_or_else(|| format!("Spark webview '{label}' was not found."))?;

    webview.reload().map_err(|error| error.to_string())
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
                        } else if shortcut.matches(Modifiers::CONTROL | Modifiers::SHIFT, Code::Tab) {
                            Some("previous-tab")
                        } else if shortcut.matches(Modifiers::CONTROL, Code::Tab) {
                            Some("next-tab")
                        } else if shortcut.matches(Modifiers::CONTROL | Modifiers::SHIFT, Code::KeyN) {
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
        .invoke_handler(tauri::generate_handler![reload_webview])
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running Spark Desktop");
}
