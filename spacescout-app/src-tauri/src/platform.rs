use std::path::Path;
use std::process::Command;

/// Reveal a file or directory in the system file manager.
/// Cross-platform implementation for Windows, macOS, and Linux.
pub fn reveal_in_file_manager(path: &Path) -> std::io::Result<()> {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg("/select,")
            .arg(path)
            .spawn()?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-R")
            .arg(path)
            .spawn()?;
    }

    #[cfg(target_os = "linux")]
    {
        let mut success = false;

        // Try dbus-send first (most reliable, works across file managers)
        // This requires UTF-8 path for the URI format
        if let Some(path_str) = path.to_str() {
            let uri = format!("array:string:file://{}", path_str);
            if Command::new("dbus-send")
                .args(&[
                    "--session",
                    "--print-reply",
                    "--dest=org.freedesktop.FileManager1",
                    "--type=method_call",
                    "/org/freedesktop/FileManager1",
                    "org.freedesktop.FileManager1.ShowItems",
                    &uri,
                    "string:",
                ])
                .spawn()
                .is_ok()
            {
                success = true;
            }
        }

        // Try specific file managers with native OsStr paths (handles non-UTF8)
        if !success {
            let managers = [
                ("nautilus", vec!["--select"]),
                ("dolphin", vec!["--select"]),
                ("nemo", vec![]),
                ("thunar", vec![]),
            ];

            for (manager, args) in &managers {
                let mut cmd = Command::new(manager);
                cmd.args(args.as_slice()).arg(path);
                if cmd.spawn().is_ok() {
                    success = true;
                    break;
                }
            }
        }

        if !success {
            // Fallback: open parent directory with xdg-open
            if let Some(parent) = path.parent() {
                Command::new("xdg-open").arg(parent).spawn()?;
            }
        }
    }

    Ok(())
}
