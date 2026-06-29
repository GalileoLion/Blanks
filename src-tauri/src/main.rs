use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use std::{
    collections::{BTreeSet, HashMap},
    env, fs, io,
    path::{Path, PathBuf},
    process::Command,
    sync::Mutex,
};
use tauri::{App, AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder, Window};

const DEFAULT_PREFERENCES: &str = include_str!("../../static/preference.json");

#[derive(Debug)]
struct AppState {
    user_data_path: PathBuf,
    preferences_path: PathBuf,
    data_path: PathBuf,
    keybindings_path: PathBuf,
    custom_dictionary_path: PathBuf,
    always_on_top: Mutex<bool>,
    font_cache: Mutex<Option<Vec<String>>>,
    preferences: Mutex<Value>,
    data: Mutex<Value>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Bootstrap {
    #[serde(rename = "type")]
    window_type: String,
    window_id: u32,
    platform: String,
    app_version: String,
    user_data_path: String,
    resources_path: String,
    ripgrep_path: String,
    tmp_dir: String,
    env: HashMap<String, String>,
    initial_state: Value,
    editor_bootstrap: Value,
    window_state: WindowState,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WindowState {
    maximized: bool,
    fullscreen: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FileStat {
    is_file: bool,
    is_directory: bool,
    size: u64,
    readonly: bool,
}

#[derive(Serialize)]
struct CommandOutput {
    status: i32,
    stdout: String,
    stderr: String,
}

#[derive(Deserialize)]
struct WindowArgs {
    value: Option<bool>,
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_bootstrap,
            ipc_send,
            ipc_invoke,
            file_empty_dir,
            file_copy,
            file_ensure_dir,
            file_move,
            file_write,
            file_read,
            file_read_text,
            file_list_dir,
            file_stat,
            path_exists,
            path_is_file,
            path_is_directory,
            path_is_executable_file,
            command_exists,
            exec_command,
            shell_open_external,
            shell_open_path,
            shell_show_item_in_folder,
            shell_trash_item,
            clipboard_write_text,
            clipboard_read_text,
            list_system_fonts,
            window_action
        ])
        .setup(|app| {
            let state = init_state(app)?;
            app.manage(state);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run Blanks Tauri app");
}

fn init_state(app: &mut App) -> Result<AppState, Box<dyn std::error::Error>> {
    let user_data_path = app.path().app_data_dir()?;
    fs::create_dir_all(&user_data_path)?;
    fs::create_dir_all(user_data_path.join("themes"))?;
    fs::create_dir_all(user_data_path.join("screenshot"))?;

    let preferences_path = user_data_path.join("preferences.json");
    let data_path = user_data_path.join("data.json");
    let keybindings_path = user_data_path.join("keybindings.json");
    let custom_dictionary_path = user_data_path.join("custom_dictionary.json");
    let default_preferences = serde_json::from_str(DEFAULT_PREFERENCES)?;
    let preferences = load_json_with_default(&preferences_path, default_preferences)?;
    let data = load_json_with_default(&data_path, default_data(&user_data_path))?;
    if !keybindings_path.exists() {
        save_json(&keybindings_path, &json!({}))?;
    }
    if !custom_dictionary_path.exists() {
        save_json(&custom_dictionary_path, &json!([]))?;
    }

    Ok(AppState {
        user_data_path,
        preferences_path,
        data_path,
        keybindings_path,
        custom_dictionary_path,
        always_on_top: Mutex::new(false),
        font_cache: Mutex::new(None),
        preferences: Mutex::new(preferences),
        data: Mutex::new(data),
    })
}

fn load_json_with_default(
    path: &Path,
    default_value: Value,
) -> Result<Value, Box<dyn std::error::Error>> {
    if path.exists() {
        let text = fs::read_to_string(path)?;
        let mut value = serde_json::from_str::<Value>(&text)?;
        merge_missing_keys(&mut value, &default_value);
        save_json(path, &value)?;
        Ok(value)
    } else {
        save_json(path, &default_value)?;
        Ok(default_value)
    }
}

fn default_data(user_data_path: &Path) -> Value {
    json!({
      "imageFolderPath": user_data_path.join("images").to_string_lossy().to_string(),
      "screenshotFolderPath": user_data_path.join("screenshot").to_string_lossy().to_string(),
      "webImages": [],
      "cloudImages": [],
      "currentUploader": "none",
      "githubToken": "",
      "imageBed": {
        "github": {
          "owner": "",
          "repo": "",
          "branch": ""
        }
      },
      "cliScript": "",
      "recentDocuments": []
    })
}

fn merge_missing_keys(value: &mut Value, defaults: &Value) {
    if let (Value::Object(value_map), Value::Object(default_map)) = (value, defaults) {
        for (key, default_value) in default_map {
            value_map
                .entry(key.clone())
                .or_insert_with(|| default_value.clone());
        }
    }
}

fn save_json(path: &Path, value: &Value) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(path, serde_json::to_string_pretty(value)?)?;
    Ok(())
}

fn map_io(error: io::Error) -> String {
    error.to_string()
}

fn json_object(value: &Value) -> Result<&Map<String, Value>, String> {
    value
        .as_object()
        .ok_or_else(|| "expected object payload".to_string())
}

fn merge_object(target: &mut Value, patch: &Value) -> Result<(), String> {
    let target = target
        .as_object_mut()
        .ok_or_else(|| "stored JSON is not an object".to_string())?;
    for (key, value) in json_object(patch)? {
        target.insert(key.clone(), value.clone());
    }
    Ok(())
}

fn save_patched_json(store: &Mutex<Value>, path: &Path, patch: &Value) -> Result<(), String> {
    let mut value = store.lock().map_err(|e| e.to_string())?;
    merge_object(&mut value, patch)?;
    save_json(path, &value).map_err(|e| e.to_string())
}

fn save_preference_patch(state: &AppState, patch: &Value) -> Result<(), String> {
    save_patched_json(&state.preferences, &state.preferences_path, patch)
}

fn save_data_patch(state: &AppState, patch: &Value) -> Result<(), String> {
    save_patched_json(&state.data, &state.data_path, patch)
}

fn combined_preferences(state: &AppState) -> Result<Value, String> {
    let mut combined = state.preferences.lock().map_err(|e| e.to_string())?.clone();
    let data = state.data.lock().map_err(|e| e.to_string())?.clone();
    merge_object(&mut combined, &data)?;
    Ok(combined)
}

fn preferred_eol(preferences: &Value) -> &'static str {
    match preferences.get("endOfLine").and_then(Value::as_str) {
        Some("crlf") => "crlf",
        Some("lf") => "lf",
        _ if cfg!(windows) => "crlf",
        _ => "lf",
    }
}

#[tauri::command]
fn get_bootstrap(window: Window, state: State<AppState>) -> Result<Bootstrap, String> {
    let preferences = state.preferences.lock().map_err(|e| e.to_string())?.clone();
    let initial_state = json!({
      "codeFontFamily": preferences.get("codeFontFamily").cloned().unwrap_or(json!("DejaVu Sans Mono")),
      "codeFontSize": format!("{}px", preferences.get("codeFontSize").and_then(Value::as_i64).unwrap_or(14)),
      "hideScrollbar": preferences.get("hideScrollbar").and_then(Value::as_bool).unwrap_or(false),
      "theme": preferences.get("theme").and_then(Value::as_str).unwrap_or("light"),
      "titleBarStyle": preferences.get("titleBarStyle").and_then(Value::as_str).unwrap_or("custom")
    });

    let mut env_map = HashMap::new();
    for key in ["PATH", "HOME", "APPIMAGE", "BLANKS_RIPGREP_PATH"] {
        if let Ok(value) = env::var(key) {
            env_map.insert(key.to_string(), value);
        }
    }

    let ripgrep_path = env::var("BLANKS_RIPGREP_PATH").unwrap_or_else(|_| "rg".to_string());
    let user_data_path = state.user_data_path.to_string_lossy().to_string();
    let editor_bootstrap = json!({
      "addBlankTab": true,
      "markdownList": [],
      "lineEnding": preferred_eol(&preferences),
      "sideBarVisibility": preferences.get("sideBarVisibility").and_then(Value::as_bool).unwrap_or(false),
      "tabBarVisibility": preferences.get("tabBarVisibility").and_then(Value::as_bool).unwrap_or(false),
      "sourceCodeModeEnabled": preferences.get("sourceCodeModeEnabled").and_then(Value::as_bool).unwrap_or(false)
    });

    let platform = match env::consts::OS {
        "macos" => "darwin",
        "windows" => "win32",
        other => other,
    }
    .to_string();

    let window_label = window.label().to_string();
    let window_type = if let Some(category) = window_label.strip_prefix("settings-") {
        if category == "preference" {
            "preference".to_string()
        } else {
            format!("preference/{category}")
        }
    } else {
        "editor".to_string()
    };

    Ok(Bootstrap {
        window_type,
        window_id: if window_label == "main" { 1 } else { 2 },
        platform,
        app_version: format!("v{}", env!("CARGO_PKG_VERSION")),
        user_data_path: user_data_path.clone(),
        resources_path: String::new(),
        ripgrep_path,
        tmp_dir: env::temp_dir().to_string_lossy().to_string(),
        env: env_map,
        initial_state,
        editor_bootstrap,
        window_state: WindowState {
            maximized: window.is_maximized().unwrap_or(false),
            fullscreen: window.is_fullscreen().unwrap_or(false),
        },
    })
}

#[tauri::command]
fn ipc_send(
    app: AppHandle,
    window: Window,
    state: State<AppState>,
    channel: String,
    args: Vec<Value>,
) -> Result<(), String> {
    match channel.as_str() {
        "mt::ask-for-user-preference" | "mt::ask-for-user-data" => {
            window
                .emit("mt::user-preference", combined_preferences(&state)?)
                .map_err(|e| e.to_string())?;
        }
        "mt::set-user-preference" => {
            let patch = args
                .first()
                .ok_or_else(|| "missing preference payload".to_string())?;
            save_preference_patch(&state, patch)?;
            window
                .emit("mt::user-preference", patch.clone())
                .map_err(|e| e.to_string())?;
        }
        "mt::set-user-data" => {
            let patch = args
                .first()
                .ok_or_else(|| "missing data payload".to_string())?;
            save_data_patch(&state, patch)?;
            window
                .emit("mt::user-preference", patch.clone())
                .map_err(|e| e.to_string())?;
        }
        "mt::get-current-language" => {
            let language = state
                .preferences
                .lock()
                .map_err(|e| e.to_string())?
                .get("language")
                .and_then(Value::as_str)
                .unwrap_or("en")
                .to_string();
            window
                .emit("mt::current-language", language)
                .map_err(|e| e.to_string())?;
        }
        "mt::select-default-directory-to-open" => {
            if let Some(path) = rfd::FileDialog::new().pick_folder() {
                let patch = json!({ "defaultDirectoryToOpen": path.to_string_lossy().to_string() });
                save_preference_patch(&state, &patch)?;
                window
                    .emit("mt::user-preference", patch)
                    .map_err(|e| e.to_string())?;
            }
        }
        "mt::ask-for-modify-image-folder-path" => {
            let selected = args
                .first()
                .and_then(Value::as_str)
                .map(PathBuf::from)
                .or_else(|| rfd::FileDialog::new().pick_folder());
            if let Some(path) = selected {
                let patch = json!({ "imageFolderPath": path.to_string_lossy().to_string() });
                save_data_patch(&state, &patch)?;
                window
                    .emit("mt::user-preference", patch)
                    .map_err(|e| e.to_string())?;
            }
        }
        "mt::cmd-open-file" => {
            if let Some(path) = rfd::FileDialog::new().pick_file() {
                open_markdown_in_window(&window, &state, path)?;
            }
        }
        "mt::cmd-open-folder" => {
            if let Some(path) = rfd::FileDialog::new().pick_folder() {
                open_directory_in_window(&window, path)?;
            }
        }
        "mt::open-file" | "mt::open-file-by-window-id" | "app-open-file-by-id" => {
            let path = args
                .iter()
                .rev()
                .find_map(Value::as_str)
                .ok_or_else(|| "missing file path".to_string())?;
            open_markdown_in_window(&window, &state, PathBuf::from(path))?;
        }
        "app-open-directory-by-id" => {
            let path = args
                .iter()
                .find_map(Value::as_str)
                .ok_or_else(|| "missing directory path".to_string())?;
            open_directory_in_window(&window, PathBuf::from(path))?;
        }
        "mt::response-file-save" | "mt::response-file-save-as" => {
            let _ = handle_save_response(
                &window,
                &state,
                args,
                channel == "mt::response-file-save-as",
            )?;
        }
        "mt::add-recently-used-document" | "menu-add-recently-used" => {
            let path = args
                .first()
                .and_then(Value::as_str)
                .ok_or_else(|| "missing recent document path".to_string())?;
            add_recent_document(&state, path)?;
        }
        "mt::open-setting-window" => {
            open_settings_window(&app, "preference")?;
        }
        "app-create-settings-window" => {
            let category = args.first().and_then(Value::as_str).unwrap_or("preference");
            open_settings_window(&app, category)?;
        }
        "mt::app-try-quit" => {
            app.exit(0);
        }
        "app-create-editor-window" | "mt::cmd-new-editor-window" => {
            open_editor_window(&app)?;
        }
        "mt::cmd-close-window" | "mt::close-window" => {
            window.close().map_err(|e| e.to_string())?;
        }
        "mt::check-for-update" => {
            window
                .emit(
                    "mt::UPDATE_NOT_AVAILABLE",
                    "Tauri build does not have an updater endpoint configured.".to_string(),
                )
                .map_err(|e| e.to_string())?;
        }
        "mt::NEED_UPDATE" => {}
        "mt::cmd-import-file" => {
            if let Some(path) = rfd::FileDialog::new().pick_file() {
                open_path_in_window(&window, &state, path)?;
            }
        }
        "mt::cmd-toggle-autosave" => {
            let current = state
                .preferences
                .lock()
                .map_err(|e| e.to_string())?
                .get("autoSave")
                .and_then(Value::as_bool)
                .unwrap_or(false);
            let patch = json!({ "autoSave": !current });
            save_preference_patch(&state, &patch)?;
            window
                .emit("mt::user-preference", patch)
                .map_err(|e| e.to_string())?;
        }
        "mt::window-toggle-always-on-top" => {
            let next_value = {
                let mut value = state.always_on_top.lock().map_err(|e| e.to_string())?;
                *value = !*value;
                *value
            };
            window
                .set_always_on_top(next_value)
                .map_err(|e| e.to_string())?;
        }
        "mt::make-screenshot" => {
            capture_screenshot(&window, &state)?;
        }
        "mt::response-export" => {
            handle_export_response(&window, args)?;
        }
        "mt::response-print" => {
            window
                .emit("mt::tauri-print", Value::Null)
                .map_err(|e| e.to_string())?;
        }
        "mt::ask-for-open-project-in-sidebar" => {
            if let Some(path) = rfd::FileDialog::new().pick_folder() {
                open_directory_in_window(&window, path)?;
            }
        }
        "mt::ask-for-image-auto-path" => {
            handle_image_auto_path(&window, args)?;
        }
        "mt::save-tabs" => {
            let _ = handle_save_tabs(&window, &state, args)?;
        }
        "mt::save-and-close-tabs" => {
            let saved_ids = handle_save_tabs(&window, &state, args)?;
            if !saved_ids.is_empty() {
                window
                    .emit("mt::force-close-tabs-by-id", saved_ids)
                    .map_err(|e| e.to_string())?;
            }
        }
        "mt::close-window-confirm" => {
            handle_close_window_confirm(&window, &state, args)?;
        }
        "mt::response-file-move-to" => {
            handle_file_move_to(&window, args)?;
        }
        "mt::rename" => {
            handle_file_rename(&window, args)?;
        }
        "mt::format-link-click" => {
            handle_format_link_click(&window, &state, args)?;
        }
        "mt::window::drop" => {
            handle_window_drop(&window, &state, args)?;
        }
        "mt::open-keybindings-config" => {
            open::that(&state.keybindings_path).map_err(|e| e.to_string())?;
        }
        "mt::keybinding-debug-dump-keyboard-info" => {
            let dump_path = env::temp_dir().join("blanks_keyboard_info.json");
            fs::write(
                &dump_path,
                serde_json::to_string_pretty(&json!({
                  "layout": "browser",
                  "keymap": {},
                  "platform": env::consts::OS
                }))
                .map_err(|e| e.to_string())?,
            )
            .map_err(map_io)?;
            open::that(dump_path).map_err(|e| e.to_string())?;
        }
        "mt::set-line-ending" => {
            if let Some(line_ending) = args.first().and_then(Value::as_str) {
                window
                    .emit("mt::set-line-ending", line_ending)
                    .map_err(|e| e.to_string())?;
            }
        }
        "mt::update-line-ending-menu"
        | "mt::update-format-menu"
        | "mt::editor-selection-changed"
        | "mt::update-sidebar-menu"
        | "mt::request-keybindings"
        | "mt::handle-renderer-error" => {}
        "mt::view-layout-changed" => {
            let patch = args
                .get(1)
                .or_else(|| args.first())
                .ok_or_else(|| "missing layout payload".to_string())?;
            save_preference_patch(&state, patch)?;
        }
        "mt::window-initialized" | "mt::window-tab-closed" | "mt::window-add-file-path" => {}
        other => return Err(format!("Tauri backend has no ipc_send handler for {other}")),
    }
    Ok(())
}

#[tauri::command]
fn ipc_invoke(
    window: Window,
    state: State<AppState>,
    channel: String,
    args: Vec<Value>,
) -> Result<Value, String> {
    match channel.as_str() {
        "mt::fs-trash-item" => {
            let path = args
                .first()
                .and_then(Value::as_str)
                .ok_or_else(|| "missing path".to_string())?;
            trash::delete(path).map_err(|e| e.to_string())?;
            Ok(Value::Bool(true))
        }
        "mt::get-recently-used-documents" => {
            let data = state.data.lock().map_err(|e| e.to_string())?;
            Ok(data
                .get("recentDocuments")
                .cloned()
                .unwrap_or_else(|| json!([])))
        }
        "mt::keybinding-get-pref-keybindings" => Ok(json!({
          "userKeybindings": load_keybindings(&state)?
        })),
        "mt::keybinding-save-user-keybindings" => {
            let payload = args.first().cloned().unwrap_or_else(|| json!({}));
            save_keybindings(&state, payload)?;
            Ok(Value::Bool(true))
        }
        "mt::keybinding-get-keyboard-info" => Ok(json!({
          "layout": "browser",
          "keymap": {}
        })),
        "mt::spellchecker-set-enabled" => {
            let enabled = args.first().and_then(Value::as_bool).unwrap_or(false);
            let patch = json!({ "spellcheckerEnabled": enabled });
            save_preference_patch(&state, &patch)?;
            Ok(Value::Bool(true))
        }
        "mt::spellchecker-switch-language" => {
            let language = args.first().and_then(Value::as_str).unwrap_or("en-US");
            let patch = json!({ "spellcheckerLanguage": language });
            save_preference_patch(&state, &patch)?;
            Ok(Value::Bool(true))
        }
        "mt::spellchecker-get-available-dictionaries" => Ok(json!(["en-US"])),
        "mt::spellchecker-get-custom-dictionary-words" => load_custom_dictionary(&state),
        "mt::spellchecker-remove-word" => {
            let word = args
                .first()
                .and_then(Value::as_str)
                .ok_or_else(|| "missing word".to_string())?;
            remove_custom_dictionary_word(&state, word)?;
            Ok(Value::Bool(true))
        }
        other => {
            let _ = window;
            let _ = state;
            Err(format!(
                "Tauri backend has no ipc_invoke handler for {other}"
            ))
        }
    }
}

fn open_editor_window(app: &AppHandle) -> Result<(), String> {
    let label = format!("main-{}", chrono_millis());
    WebviewWindowBuilder::new(app, label, WebviewUrl::App("index.html".into()))
        .title("Blanks")
        .inner_size(1200.0, 780.0)
        .min_inner_size(450.0, 350.0)
        .decorations(false)
        .build()
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn chrono_millis() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or_default()
}

fn open_directory_in_window(window: &Window, path: PathBuf) -> Result<(), String> {
    window
        .emit("mt::open-directory", path.to_string_lossy().to_string())
        .map_err(|e| e.to_string())?;
    emit_project_tree(window, &path)
}

fn emit_project_tree(window: &Window, root: &Path) -> Result<(), String> {
    if !root.is_dir() {
        return Err(format!("{} is not a directory", root.to_string_lossy()));
    }
    scan_project_tree(window, root, root)
}

fn scan_project_tree(window: &Window, root: &Path, dir: &Path) -> Result<(), String> {
    let mut entries = fs::read_dir(dir)
        .map_err(map_io)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(map_io)?;
    entries.sort_by_key(|entry| entry.file_name().to_string_lossy().to_lowercase());

    for entry in entries {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if name == ".git" || name == "node_modules" || name == "$RECYCLE.BIN" {
            continue;
        }
        let metadata = entry.metadata().map_err(map_io)?;
        let payload = json!({
          "pathname": path.to_string_lossy().to_string(),
          "name": name,
          "isDirectory": metadata.is_dir(),
          "isFile": metadata.is_file(),
          "isMarkdown": metadata.is_file() && has_markdown_extension(&path),
          "birthTime": metadata.created().ok().and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok()).map(|duration| duration.as_millis()),
          "mtime": metadata.modified().ok().and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok()).map(|duration| duration.as_millis()),
          "data": Value::Null
        });
        if metadata.is_dir() {
            if path != root {
                window
                    .emit(
                        "mt::update-object-tree",
                        json!({ "type": "addDir", "change": payload }),
                    )
                    .map_err(|e| e.to_string())?;
            }
            scan_project_tree(window, root, &path)?;
        } else {
            window
                .emit(
                    "mt::update-object-tree",
                    json!({ "type": "add", "change": payload }),
                )
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

fn has_markdown_extension(path: &Path) -> bool {
    let Some(name) = path
        .file_name()
        .map(|name| name.to_string_lossy().to_lowercase())
    else {
        return false;
    };
    [
        ".markdown",
        ".mdown",
        ".mkdn",
        ".mkd",
        ".md",
        ".rmd",
        ".qmd",
        ".txt",
    ]
    .iter()
    .any(|extension| name.ends_with(extension))
}

fn load_keybindings(state: &AppState) -> Result<Value, String> {
    let text = fs::read_to_string(&state.keybindings_path).map_err(map_io)?;
    let value = serde_json::from_str::<Value>(&text).map_err(|e| e.to_string())?;
    if value.is_object() {
        Ok(value)
    } else {
        Ok(json!({}))
    }
}

fn save_keybindings(state: &AppState, payload: Value) -> Result<(), String> {
    let mut normalized = Map::new();
    match payload {
        Value::Object(object) => {
            for (key, value) in object {
                if let Some(accelerator) = value.as_str() {
                    normalized.insert(key, Value::String(accelerator.to_string()));
                }
            }
        }
        Value::Array(entries) => {
            for entry in entries {
                if let Some(pair) = entry.as_array() {
                    if pair.len() == 2 {
                        if let (Some(key), Some(accelerator)) = (pair[0].as_str(), pair[1].as_str())
                        {
                            normalized
                                .insert(key.to_string(), Value::String(accelerator.to_string()));
                        }
                    }
                }
            }
        }
        _ => {}
    }
    save_json(&state.keybindings_path, &Value::Object(normalized)).map_err(|e| e.to_string())
}

fn load_custom_dictionary(state: &AppState) -> Result<Value, String> {
    let text = fs::read_to_string(&state.custom_dictionary_path).map_err(map_io)?;
    let value = serde_json::from_str::<Value>(&text).map_err(|e| e.to_string())?;
    if value.is_array() {
        Ok(value)
    } else {
        Ok(json!([]))
    }
}

fn remove_custom_dictionary_word(state: &AppState, word: &str) -> Result<(), String> {
    let mut words = load_custom_dictionary(state)?
        .as_array()
        .cloned()
        .unwrap_or_default();
    words.retain(|item| item.as_str() != Some(word));
    save_json(&state.custom_dictionary_path, &Value::Array(words)).map_err(|e| e.to_string())
}

fn handle_export_response(window: &Window, args: Vec<Value>) -> Result<(), String> {
    let payload = args
        .first()
        .ok_or_else(|| "missing export payload".to_string())?;
    let export_type = payload.get("type").and_then(Value::as_str).unwrap_or("");
    if export_type == "pdf" {
        window
            .emit("mt::tauri-print", Value::Null)
            .map_err(|e| e.to_string())?;
        emit_notification(
            window,
            "PDF export",
            "warning",
            "Use the system print dialog to save this document as PDF in the Tauri build.",
        )?;
        return Ok(());
    }

    let content = payload
        .get("content")
        .and_then(Value::as_str)
        .ok_or_else(|| "missing export content".to_string())?;
    let pathname = payload
        .get("pathname")
        .and_then(Value::as_str)
        .unwrap_or("");
    let title = payload
        .get("title")
        .and_then(Value::as_str)
        .unwrap_or("Untitled");
    let extension = if export_type == "styledHtml" {
        "html"
    } else {
        "html"
    };
    let default_dir = if pathname.is_empty() {
        dirs::document_dir().unwrap_or_else(env::temp_dir)
    } else {
        PathBuf::from(pathname)
            .parent()
            .map(Path::to_path_buf)
            .unwrap_or_else(env::temp_dir)
    };
    let base_name = if pathname.is_empty() {
        sanitize_filename(title)
    } else {
        PathBuf::from(pathname)
            .file_stem()
            .map(|value| sanitize_filename(&value.to_string_lossy()))
            .unwrap_or_else(|| sanitize_filename(title))
    };

    let file_path = rfd::FileDialog::new()
        .set_directory(default_dir)
        .set_file_name(format!("{base_name}.{extension}"))
        .add_filter("Hypertext Markup Language", &[extension])
        .save_file();

    if let Some(file_path) = file_path {
        fs::write(&file_path, content).map_err(map_io)?;
        window
            .emit(
                "mt::export-success",
                json!({ "type": export_type, "filePath": file_path.to_string_lossy().to_string() }),
            )
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn emit_notification(
    window: &Window,
    title: &str,
    notification_type: &str,
    message: &str,
) -> Result<(), String> {
    window
        .emit(
            "mt::show-notification",
            json!({ "title": title, "type": notification_type, "message": message }),
        )
        .map_err(|e| e.to_string())
}

fn handle_image_auto_path(window: &Window, args: Vec<Value>) -> Result<(), String> {
    let payload = args
        .first()
        .ok_or_else(|| "missing image path payload".to_string())?;
    let pathname = payload
        .get("pathname")
        .and_then(Value::as_str)
        .unwrap_or("");
    let src = payload.get("src").and_then(Value::as_str).unwrap_or("");
    let id = payload.get("id").and_then(Value::as_str).unwrap_or("");
    if id.is_empty() {
        return Err("missing image auto path id".to_string());
    }

    let full_path = if Path::new(src).is_absolute() {
        PathBuf::from(src)
    } else {
        PathBuf::from(pathname)
            .parent()
            .unwrap_or(Path::new(""))
            .join(src)
    };
    let (directory, search_key) =
        if src.ends_with(std::path::MAIN_SEPARATOR) || src.ends_with('/') || src.ends_with('\\') {
            (full_path, String::new())
        } else {
            (
                full_path
                    .parent()
                    .map(Path::to_path_buf)
                    .unwrap_or_else(|| PathBuf::from(".")),
                full_path
                    .file_name()
                    .map(|value| value.to_string_lossy().to_string())
                    .unwrap_or_default(),
            )
        };
    let candidates = image_path_candidates(&directory, &search_key).unwrap_or_default();
    let event_name = format!("mt::response-of-image-path-{id}");
    window
        .emit(event_name.as_str(), Value::Array(candidates))
        .map_err(|e| e.to_string())
}

fn image_path_candidates(directory: &Path, search_key: &str) -> io::Result<Vec<Value>> {
    let mut values = Vec::new();
    for entry in fs::read_dir(directory)? {
        let entry = entry?;
        let name = entry.file_name().to_string_lossy().to_string();
        if name == "$RECYCLE.BIN" {
            continue;
        }
        if !search_key.is_empty() && !name.to_lowercase().contains(&search_key.to_lowercase()) {
            continue;
        }
        let metadata = entry.metadata()?;
        let entry_type = if metadata.is_dir() {
            Some("directory")
        } else if is_image_file(&entry.path()) {
            Some("image")
        } else {
            None
        };
        if let Some(entry_type) = entry_type {
            values.push(json!({ "file": name, "type": entry_type }));
        }
    }
    values.sort_by_key(|value| {
        value
            .get("file")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_lowercase()
    });
    Ok(values)
}

fn is_image_file(path: &Path) -> bool {
    let Some(name) = path
        .file_name()
        .map(|name| name.to_string_lossy().to_lowercase())
    else {
        return false;
    };
    [
        ".apng", ".avif", ".bmp", ".gif", ".ico", ".jpg", ".jpeg", ".png", ".svg", ".webp",
    ]
    .iter()
    .any(|extension| name.ends_with(extension))
}

fn capture_screenshot(window: &Window, state: &AppState) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let screenshot_path = state
            .user_data_path
            .join("screenshot")
            .join(format!("screenshot-{}.png", chrono_millis()));
        let status = Command::new("screencapture")
            .arg("-i")
            .arg(&screenshot_path)
            .status()
            .map_err(|e| e.to_string())?;
        if status.success() {
            window
                .emit("mt::screenshot-captured", Value::Null)
                .map_err(|e| e.to_string())?;
        }
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    {
        emit_notification(
            window,
            "Screenshot",
            "warning",
            "Interactive screenshots are currently available on macOS builds.",
        )
    }
}

fn handle_format_link_click(
    window: &Window,
    state: &AppState,
    args: Vec<Value>,
) -> Result<(), String> {
    let payload = args
        .first()
        .ok_or_else(|| "missing link payload".to_string())?;
    let data = payload.get("data").unwrap_or(&Value::Null);
    let dirname = payload.get("dirname").and_then(Value::as_str).unwrap_or("");
    let raw_url = data
        .get("href")
        .and_then(Value::as_str)
        .or_else(|| data.get("text").and_then(Value::as_str))
        .unwrap_or("")
        .trim()
        .trim_start_matches('<')
        .trim_end_matches('>');

    if raw_url.is_empty() {
        return Ok(());
    }
    if raw_url.starts_with("http://") || raw_url.starts_with("https://") {
        return open::that(raw_url).map_err(|e| e.to_string());
    }
    if raw_url.contains("://") {
        return Ok(());
    }

    let mut pathname = PathBuf::from(raw_url);
    if !pathname.is_absolute() && !dirname.is_empty() {
        pathname = PathBuf::from(dirname).join(pathname);
    }
    let pathname = fs::canonicalize(&pathname).unwrap_or(pathname);
    if pathname.exists() {
        open_path_in_window(window, state, pathname)?;
    } else {
        emit_notification(
            window,
            "Link target not found",
            "error",
            &format!("{} does not exist.", pathname.to_string_lossy()),
        )?;
    }
    Ok(())
}

fn handle_window_drop(window: &Window, state: &AppState, args: Vec<Value>) -> Result<(), String> {
    let files = args
        .first()
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    for file in files {
        if let Some(path) = file.as_str() {
            open_path_in_window(window, state, PathBuf::from(path))?;
        }
    }
    Ok(())
}

fn open_markdown_in_window(window: &Window, state: &AppState, path: PathBuf) -> Result<(), String> {
    let document = load_markdown_document(state, &path)?;
    add_recent_document(state, &path.to_string_lossy())?;
    window
        .emit(
            "mt::open-new-tab",
            vec![document, json!({}), Value::Bool(true)],
        )
        .map_err(|e| e.to_string())
}

fn open_path_in_window(window: &Window, state: &AppState, path: PathBuf) -> Result<(), String> {
    if path.is_dir() {
        open_directory_in_window(window, path)
    } else if has_markdown_extension(&path) {
        open_markdown_in_window(window, state, path)
    } else {
        open::that(path).map_err(|e| e.to_string())
    }
}

fn load_markdown_document(state: &AppState, path: &Path) -> Result<Value, String> {
    let metadata = fs::metadata(path).map_err(map_io)?;
    let mut markdown = fs::read_to_string(path).map_err(map_io)?;
    let is_crlf = markdown.contains("\r\n");
    let is_lf = markdown.replace("\r\n", "").contains('\n');
    let is_mixed_line_endings = is_crlf && is_lf;
    let line_ending = if is_crlf && !is_lf {
        "crlf"
    } else {
        let preferences = state.preferences.lock().map_err(|e| e.to_string())?;
        preferred_eol(&preferences)
    };
    let adjust_line_ending_on_save = line_ending == "crlf";
    if is_crlf {
        markdown = markdown.replace("\r\n", "\n");
    }
    let filename = path
        .file_name()
        .map(|name| name.to_string_lossy().to_string())
        .unwrap_or_default();
    Ok(json!({
      "markdown": markdown,
      "filename": filename,
      "pathname": path.to_string_lossy().to_string(),
      "encoding": { "encoding": "utf8" },
      "lineEnding": line_ending,
      "adjustLineEndingOnSave": adjust_line_ending_on_save,
      "trimTrailingNewline": 2,
      "isMixedLineEndings": is_mixed_line_endings,
      "birthTime": metadata.created().ok().and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok()).map(|duration| duration.as_millis()),
      "mtime": metadata.modified().ok().and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok()).map(|duration| duration.as_millis())
    }))
}

fn handle_save_response(
    window: &Window,
    state: &AppState,
    args: Vec<Value>,
    force_save_as: bool,
) -> Result<bool, String> {
    let id = args.first().cloned().unwrap_or(Value::Null);
    let filename = args.get(1).and_then(Value::as_str).unwrap_or("Untitled");
    let pathname = args.get(2).and_then(Value::as_str).unwrap_or("");
    let markdown = args.get(3).and_then(Value::as_str).unwrap_or("");
    let options = args.get(4).cloned().unwrap_or_else(|| json!({}));
    let default_path = args.get(5).and_then(Value::as_str).unwrap_or("");

    let mut file_path = if !force_save_as && !pathname.is_empty() {
        Some(PathBuf::from(pathname))
    } else {
        let mut dialog = rfd::FileDialog::new();
        if !default_path.is_empty() {
            dialog = dialog.set_directory(default_path);
        }
        dialog = dialog.set_file_name(format!("{}.md", recommend_filename(markdown, filename)));
        dialog.save_file()
    };

    let Some(mut file_path) = file_path.take() else {
        return Ok(false);
    };

    if file_path.extension().is_none() {
        file_path.set_extension("md");
    }

    let mut content = markdown.to_string();
    let use_crlf = options
        .get("lineEnding")
        .and_then(Value::as_str)
        .map(|value| value == "crlf")
        .unwrap_or(false)
        || options
            .get("adjustLineEndingOnSave")
            .and_then(Value::as_bool)
            .unwrap_or(false);
    if use_crlf {
        content = content.replace('\n', "\r\n");
    }
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent).map_err(map_io)?;
    }
    fs::write(&file_path, content).map_err(map_io)?;
    add_recent_document(state, &file_path.to_string_lossy())?;

    let filename = file_path
        .file_name()
        .map(|name| name.to_string_lossy().to_string())
        .unwrap_or_default();
    if pathname.is_empty() || force_save_as {
        window
      .emit(
        "mt::set-pathname",
        json!({ "id": id, "pathname": file_path.to_string_lossy().to_string(), "filename": filename }),
      )
      .map_err(|e| e.to_string())?;
    } else {
        window
            .emit("mt::tab-saved", id)
            .map_err(|e| e.to_string())?;
    }
    Ok(true)
}

fn handle_save_tabs(
    window: &Window,
    state: &AppState,
    args: Vec<Value>,
) -> Result<Vec<Value>, String> {
    let Some(files) = args.first().and_then(Value::as_array) else {
        return Ok(Vec::new());
    };
    let mut saved_ids = Vec::new();
    for file in files {
        let id = file.get("id").cloned().unwrap_or(Value::Null);
        let filename = file
            .get("filename")
            .and_then(Value::as_str)
            .unwrap_or("Untitled");
        let pathname = file.get("pathname").and_then(Value::as_str).unwrap_or("");
        let markdown = file.get("markdown").and_then(Value::as_str).unwrap_or("");
        let options = file.get("options").cloned().unwrap_or_else(|| json!({}));
        let default_path = file
            .get("defaultPath")
            .and_then(Value::as_str)
            .unwrap_or("");
        let saved = handle_save_response(
            window,
            state,
            vec![
                id.clone(),
                Value::String(filename.to_string()),
                Value::String(pathname.to_string()),
                Value::String(markdown.to_string()),
                options,
                Value::String(default_path.to_string()),
            ],
            false,
        )?;
        if saved {
            saved_ids.push(id);
        }
    }
    Ok(saved_ids)
}

fn handle_close_window_confirm(
    window: &Window,
    state: &AppState,
    args: Vec<Value>,
) -> Result<(), String> {
    let expected = args
        .first()
        .and_then(Value::as_array)
        .map(|items| items.len())
        .unwrap_or(0);
    let saved_ids = handle_save_tabs(window, state, args)?;
    if expected == 0 || saved_ids.len() == expected {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn handle_file_move_to(window: &Window, args: Vec<Value>) -> Result<(), String> {
    let payload = args
        .first()
        .ok_or_else(|| "missing move payload".to_string())?;
    let id = payload.get("id").cloned().unwrap_or(Value::Null);
    let pathname = payload
        .get("pathname")
        .and_then(Value::as_str)
        .ok_or_else(|| "missing pathname".to_string())?;
    let source_path = PathBuf::from(pathname);
    let mut dialog = rfd::FileDialog::new();
    if let Some(parent) = source_path.parent() {
        dialog = dialog.set_directory(parent);
    }
    if let Some(filename) = source_path
        .file_name()
        .map(|value| value.to_string_lossy().to_string())
    {
        dialog = dialog.set_file_name(filename);
    }
    let selected = dialog.save_file();
    let Some(file_path) = selected else {
        return Ok(());
    };
    fs::rename(pathname, &file_path).map_err(map_io)?;
    window
    .emit(
      "mt::set-pathname",
      json!({
        "id": id,
        "pathname": file_path.to_string_lossy().to_string(),
        "filename": file_path.file_name().map(|value| value.to_string_lossy().to_string()).unwrap_or_default()
      }),
    )
    .map_err(|e| e.to_string())
}

fn handle_file_rename(window: &Window, args: Vec<Value>) -> Result<(), String> {
    let payload = args
        .first()
        .ok_or_else(|| "missing rename payload".to_string())?;
    let id = payload.get("id").cloned().unwrap_or(Value::Null);
    let pathname = payload
        .get("pathname")
        .and_then(Value::as_str)
        .ok_or_else(|| "missing pathname".to_string())?;
    let new_pathname = payload
        .get("newPathname")
        .and_then(Value::as_str)
        .ok_or_else(|| "missing newPathname".to_string())?;
    if pathname == new_pathname {
        return Ok(());
    }
    if Path::new(new_pathname).exists() {
        emit_notification(
            window,
            "Rename failed",
            "error",
            &format!(
                "{} already exists.",
                Path::new(new_pathname)
                    .file_name()
                    .map(|value| value.to_string_lossy())
                    .unwrap_or_default()
            ),
        )?;
        return Ok(());
    }
    fs::rename(pathname, new_pathname).map_err(map_io)?;
    window
    .emit(
      "mt::set-pathname",
      json!({
        "id": id,
        "pathname": new_pathname,
        "filename": Path::new(new_pathname).file_name().map(|value| value.to_string_lossy().to_string()).unwrap_or_default()
      }),
    )
    .map_err(|e| e.to_string())
}

fn recommend_filename(markdown: &str, fallback: &str) -> String {
    markdown
        .lines()
        .find_map(|line| {
            let text = line.trim().trim_start_matches('#').trim();
            if text.is_empty() {
                None
            } else {
                Some(sanitize_filename(text))
            }
        })
        .unwrap_or_else(|| {
            sanitize_filename(if fallback.is_empty() {
                "Untitled"
            } else {
                fallback
            })
        })
}

fn sanitize_filename(value: &str) -> String {
    let value = value
        .chars()
        .map(|ch| {
            if matches!(ch, '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|') {
                '-'
            } else {
                ch
            }
        })
        .collect::<String>();
    value.trim().trim_end_matches(".md").to_string()
}

fn add_recent_document(state: &AppState, path: &str) -> Result<(), String> {
    let mut data = state.data.lock().map_err(|e| e.to_string())?;
    {
        let object = data
            .as_object_mut()
            .ok_or_else(|| "data store is not an object".to_string())?;
        let mut recents = object
            .get("recentDocuments")
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();
        recents.retain(|item| item.as_str() != Some(path));
        recents.insert(0, Value::String(path.to_string()));
        recents.truncate(10);
        object.insert("recentDocuments".to_string(), Value::Array(recents));
    }
    save_json(&state.data_path, &data).map_err(|e| e.to_string())
}

fn open_settings_window(app: &AppHandle, category: &str) -> Result<(), String> {
    let label = format!("settings-{}", category.replace('/', "-"));
    if let Some(window) = app.get_webview_window(&label) {
        window.set_focus().map_err(|e| e.to_string())?;
        if category != "preference" {
            window
                .emit("settings::change-tab", category)
                .map_err(|e| e.to_string())?;
        }
        return Ok(());
    }

    WebviewWindowBuilder::new(app, label, WebviewUrl::App("index.html".into()))
        .title("Preferences")
        .inner_size(950.0, 650.0)
        .min_inner_size(450.0, 350.0)
        .decorations(false)
        .build()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn file_empty_dir(path: String) -> Result<(), String> {
    let path = PathBuf::from(path);
    if path.exists() {
        for entry in fs::read_dir(&path).map_err(map_io)? {
            let entry = entry.map_err(map_io)?;
            let item = entry.path();
            if item.is_dir() {
                fs::remove_dir_all(item).map_err(map_io)?;
            } else {
                fs::remove_file(item).map_err(map_io)?;
            }
        }
    } else {
        fs::create_dir_all(path).map_err(map_io)?;
    }
    Ok(())
}

#[tauri::command]
fn file_copy(src: String, dest: String) -> Result<(), String> {
    copy_path(Path::new(&src), Path::new(&dest)).map_err(|e| e.to_string())
}

#[tauri::command]
fn file_ensure_dir(path: String) -> Result<(), String> {
    fs::create_dir_all(path).map_err(map_io)
}

#[tauri::command]
fn file_move(src: String, dest: String) -> Result<(), String> {
    match fs::rename(&src, &dest) {
        Ok(_) => Ok(()),
        Err(_) => {
            copy_path(Path::new(&src), Path::new(&dest)).map_err(|e| e.to_string())?;
            let src_path = Path::new(&src);
            if src_path.is_dir() {
                fs::remove_dir_all(src_path).map_err(map_io)
            } else {
                fs::remove_file(src_path).map_err(map_io)
            }
        }
    }
}

fn copy_path(src: &Path, dest: &Path) -> io::Result<()> {
    if src.is_dir() {
        fs::create_dir_all(dest)?;
        for entry in fs::read_dir(src)? {
            let entry = entry?;
            copy_path(&entry.path(), &dest.join(entry.file_name()))?;
        }
    } else {
        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::copy(src, dest)?;
    }
    Ok(())
}

#[tauri::command]
fn file_write(path: String, data: Value, append: bool) -> Result<(), String> {
    let path = PathBuf::from(path);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(map_io)?;
    }
    let bytes = json_to_bytes(data)?;
    if append {
        use std::io::Write;
        let mut file = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(path)
            .map_err(map_io)?;
        file.write_all(&bytes).map_err(map_io)
    } else {
        fs::write(path, bytes).map_err(map_io)
    }
}

fn json_to_bytes(data: Value) -> Result<Vec<u8>, String> {
    match data {
        Value::String(text) => Ok(text.into_bytes()),
        Value::Array(items) => items
            .into_iter()
            .map(|item| {
                item.as_u64()
                    .and_then(|n| u8::try_from(n).ok())
                    .ok_or_else(|| "byte array contains non-byte value".to_string())
            })
            .collect(),
        Value::Null => Ok(Vec::new()),
        other => serde_json::to_vec(&other).map_err(|e| e.to_string()),
    }
}

#[tauri::command]
fn file_read(path: String) -> Result<Vec<u8>, String> {
    fs::read(path).map_err(map_io)
}

#[tauri::command]
fn file_read_text(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(map_io)
}

#[tauri::command]
fn file_list_dir(path: String) -> Result<Vec<String>, String> {
    let mut names = Vec::new();
    for entry in fs::read_dir(path).map_err(map_io)? {
        let entry = entry.map_err(map_io)?;
        names.push(entry.file_name().to_string_lossy().to_string());
    }
    Ok(names)
}

#[tauri::command]
fn file_stat(path: String) -> Result<FileStat, String> {
    let metadata = fs::metadata(path).map_err(map_io)?;
    Ok(FileStat {
        is_file: metadata.is_file(),
        is_directory: metadata.is_dir(),
        size: metadata.len(),
        readonly: metadata.permissions().readonly(),
    })
}

#[tauri::command]
fn path_exists(path: String) -> bool {
    Path::new(&path).exists()
}

#[tauri::command]
fn path_is_file(path: String) -> bool {
    Path::new(&path).is_file()
}

#[tauri::command]
fn path_is_directory(path: String) -> bool {
    Path::new(&path).is_dir()
}

#[tauri::command]
fn path_is_executable_file(path: String) -> bool {
    let path = Path::new(&path);
    if !path.is_file() {
        return false;
    }
    #[cfg(windows)]
    {
        true
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::metadata(path)
            .map(|metadata| metadata.permissions().mode() & 0o111 != 0)
            .unwrap_or(false)
    }
}

#[tauri::command]
fn command_exists(command: String) -> bool {
    let command_path = Path::new(&command);
    if command_path.components().count() > 1 {
        return path_is_executable_file(command);
    }

    let path_var = env::var_os("PATH").unwrap_or_default();
    env::split_paths(&path_var).any(|dir| {
        let candidate = dir.join(&command);
        if path_is_executable_file(candidate.to_string_lossy().to_string()) {
            return true;
        }
        #[cfg(windows)]
        {
            for ext in ["exe", "cmd", "bat"] {
                if path_is_executable_file(
                    candidate.with_extension(ext).to_string_lossy().to_string(),
                ) {
                    return true;
                }
            }
        }
        false
    })
}

#[tauri::command]
fn exec_command(
    program: String,
    args: Vec<String>,
    cwd: String,
    env: HashMap<String, String>,
) -> Result<CommandOutput, String> {
    let mut command = Command::new(program);
    command.args(args);
    if !cwd.is_empty() {
        command.current_dir(cwd);
    }
    for (key, value) in env {
        command.env(key, value);
    }
    let output = command.output().map_err(|e| e.to_string())?;
    Ok(CommandOutput {
        status: output.status.code().unwrap_or(-1),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

#[tauri::command]
fn shell_open_external(url: String) -> Result<(), String> {
    open::that(url).map_err(|e| e.to_string())
}

#[tauri::command]
fn shell_open_path(path: String) -> Result<(), String> {
    open::that(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn shell_show_item_in_folder(path: String) -> Result<(), String> {
    let path = PathBuf::from(path);
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-R")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(format!("/select,{}", path.to_string_lossy()))
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let folder = path.parent().unwrap_or(Path::new("."));
        open::that(folder).map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn shell_trash_item(path: String) -> Result<(), String> {
    trash::delete(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn clipboard_write_text(text: String) -> Result<(), String> {
    let mut clipboard = arboard::Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.set_text(text).map_err(|e| e.to_string())
}

#[tauri::command]
fn clipboard_read_text() -> Result<String, String> {
    let mut clipboard = arboard::Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.get_text().map_err(|e| e.to_string())
}

#[tauri::command]
fn list_system_fonts(state: State<AppState>) -> Result<Vec<String>, String> {
    if let Some(fonts) = state.font_cache.lock().map_err(|e| e.to_string())?.clone() {
        return Ok(fonts);
    }

    let mut fonts = BTreeSet::new();
    collect_platform_fonts(&mut fonts);
    collect_font_directory_fallbacks(&mut fonts);
    let fonts = fonts.into_iter().collect::<Vec<_>>();
    *state.font_cache.lock().map_err(|e| e.to_string())? = Some(fonts.clone());
    Ok(fonts)
}

fn collect_platform_fonts(fonts: &mut BTreeSet<String>) {
    #[cfg(target_os = "macos")]
    {
        if let Ok(output) = Command::new("system_profiler")
            .args(["SPFontsDataType", "-json"])
            .output()
        {
            if output.status.success() {
                if let Ok(value) = serde_json::from_slice::<Value>(&output.stdout) {
                    collect_font_families(&value, fonts);
                }
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(output) = Command::new("fc-list").args([":", "family"]).output() {
            if output.status.success() {
                for line in String::from_utf8_lossy(&output.stdout).lines() {
                    for family in line.split(',') {
                        insert_font_family(fonts, family);
                    }
                }
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        let script = r#"
      $paths = @(
        'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts',
        'HKCU:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts'
      )
      foreach ($path in $paths) {
        if (Test-Path $path) {
          (Get-ItemProperty $path).PSObject.Properties |
            Where-Object { $_.Name -notlike 'PS*' } |
            ForEach-Object { $_.Name -replace '\s*\(.*?\)\s*$', '' }
        }
      }
    "#;
        if let Ok(output) = Command::new("powershell")
            .args(["-NoProfile", "-Command", script])
            .output()
        {
            if output.status.success() {
                for line in String::from_utf8_lossy(&output.stdout).lines() {
                    insert_font_family(fonts, line);
                }
            }
        }
    }
}

fn collect_font_families(value: &Value, fonts: &mut BTreeSet<String>) {
    match value {
        Value::Object(object) => {
            if let Some(family) = object.get("family").and_then(Value::as_str) {
                insert_font_family(fonts, family);
            }
            for value in object.values() {
                collect_font_families(value, fonts);
            }
        }
        Value::Array(items) => {
            for value in items {
                collect_font_families(value, fonts);
            }
        }
        _ => {}
    }
}

fn insert_font_family(fonts: &mut BTreeSet<String>, family: &str) {
    let family = family.trim().trim_matches('"');
    if !family.is_empty() {
        fonts.insert(family.to_string());
    }
}

fn collect_font_directory_fallbacks(fonts: &mut BTreeSet<String>) {
    for dir in font_directories() {
        collect_font_files(&dir, fonts);
    }
}

fn font_directories() -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    #[cfg(target_os = "macos")]
    {
        dirs.push(PathBuf::from("/System/Library/Fonts"));
        dirs.push(PathBuf::from("/Library/Fonts"));
        if let Some(home) = dirs::home_dir() {
            dirs.push(home.join("Library/Fonts"));
        }
    }
    #[cfg(target_os = "linux")]
    {
        dirs.push(PathBuf::from("/usr/share/fonts"));
        dirs.push(PathBuf::from("/usr/local/share/fonts"));
        if let Some(home) = dirs::home_dir() {
            dirs.push(home.join(".local/share/fonts"));
            dirs.push(home.join(".fonts"));
        }
    }
    #[cfg(target_os = "windows")]
    {
        if let Ok(windir) = env::var("WINDIR") {
            dirs.push(PathBuf::from(windir).join("Fonts"));
        }
    }
    dirs
}

fn collect_font_files(dir: &Path, fonts: &mut BTreeSet<String>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_font_files(&path, fonts);
            continue;
        }
        let Some(extension) = path
            .extension()
            .map(|value| value.to_string_lossy().to_lowercase())
        else {
            continue;
        };
        if !matches!(extension.as_str(), "ttf" | "ttc" | "otf") {
            continue;
        }
        if let Some(stem) = path.file_stem().map(|value| value.to_string_lossy()) {
            insert_font_family(fonts, &stem.replace(['-', '_'], " "));
        }
    }
}

#[tauri::command]
fn window_action(window: Window, action: String, args: Value) -> Result<(), String> {
    let args: WindowArgs = serde_json::from_value(args).unwrap_or(WindowArgs { value: None });
    match action.as_str() {
        "close" => window.close().map_err(|e| e.to_string()),
        "minimize" => window.minimize().map_err(|e| e.to_string()),
        "maximize" => window.maximize().map_err(|e| e.to_string()),
        "unmaximize" => window.unmaximize().map_err(|e| e.to_string()),
        "set_fullscreen" => window
            .set_fullscreen(args.value.unwrap_or(false))
            .map_err(|e| e.to_string()),
        "set_always_on_top" => window
            .set_always_on_top(args.value.unwrap_or(false))
            .map_err(|e| e.to_string()),
        other => Err(format!("unknown window action {other}")),
    }
}
