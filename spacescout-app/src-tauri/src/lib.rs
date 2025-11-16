mod commands;
mod platform;

use commands::AppState;
use tokio::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(Mutex::new(AppState::default()))
        .invoke_handler(tauri::generate_handler![
            commands::start_scan,
            commands::set_zoom,
            commands::open_in_file_manager,
            commands::get_breadcrumbs,
            commands::get_home_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
