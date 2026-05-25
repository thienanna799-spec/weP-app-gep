Set WshShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")
' Lấy đường dẫn thư mục tuyệt đối chứa chính tệp tin VBScript này
strScriptDir = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Chạy tệp tin batch auto_git_push.bat ở chế độ ẩn hoàn toàn (0) và không đợi kết quả trả về (false)
WshShell.Run Chr(34) & strScriptDir & "\auto_git_push.bat" & Chr(34), 0, false
