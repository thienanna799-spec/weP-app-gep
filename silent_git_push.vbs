Set WshShell = CreateObject("WScript.Shell")
' Chạy tệp tin batch auto_git_push.bat ở chế độ ẩn hoàn toàn (0) và không đợi kết quả trả về (false)
WshShell.Run Chr(34) & WshShell.CurrentDirectory & "\auto_git_push.bat" & Chr(34), 0, false
