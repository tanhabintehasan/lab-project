# PowerShell script to rename image files in public/uploads/settings
# Run this from the project root or adjust the $folder path as needed

$folder = "D:\lab-project-main\public\uploads\settings"

# Ensure the folder exists
if (-not (Test-Path $folder)) {
    Write-Error "Folder not found: $folder"
    exit 1
}

# Rename equip files: .jfif -> .png
Rename-Item -Path "$folder\equip-1.jfif" -NewName "equip-1.png" -ErrorAction Stop
Rename-Item -Path "$folder\equip-2.jfif" -NewName "equip-2.png" -ErrorAction Stop
Rename-Item -Path "$folder\equip-3.jfif" -NewName "equip-3.png" -ErrorAction Stop

# Rename slide files: add -pic and fix spaces
Rename-Item -Path "$folder\slide -2 .jpg" -NewName "slide-2-pic.jpg" -ErrorAction Stop
Rename-Item -Path "$folder\slide-1.jpg" -NewName "slide-1-pic.jpg" -ErrorAction Stop

Write-Host "All files renamed successfully!"
