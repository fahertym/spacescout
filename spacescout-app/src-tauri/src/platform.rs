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
        // Try different file managers in order of preference
        let managers = vec![
            ("dbus-send", vec![
                "--session",
                "--print-reply",
                "--dest=org.freedesktop.FileManager1",
                "--type=method_call",
                "/org/freedesktop/FileManager1",
                "org.freedesktop.FileManager1.ShowItems",
                &format!("array:string:file://{}", path.display()),
                "string:",
            ]),
            ("nautilus", vec!["--select", path.to_str().unwrap_or("")]),
            ("dolphin", vec!["--select", path.to_str().unwrap_or("")]),
            ("nemo", vec![path.to_str().unwrap_or("")]),
            ("thunar", vec![path.to_str().unwrap_or("")]),
        ];

        let mut success = false;
        for (manager, args) in managers {
            if Command::new(manager).args(&args).spawn().is_ok() {
                success = true;
                break;
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
