# Visual Studio Build Tools Installation Guide

## Step 1: Download the Installer ✅ (Already Started)

The installer should be downloading to your default Downloads folder.

**If not started automatically:**
- Go directly to: https://aka.ms/vs/17/release/vs_BuildTools.exe
- Or visit: https://visualstudio.microsoft.com/visual-cpp-build-tools/

---

## Step 2: Run the Installer

1. Find **vs_BuildTools.exe** in your Downloads folder
2. **Right-click** → **Run as Administrator**
3. Wait for "Visual Studio Installer" window to open (~1 minute)

---

## Step 3: Select Workload

Once the installer opens:

1. Look for **"Desktop development with C++"** workload
2. **CHECK** the checkbox next to it
3. On the right side, make sure these are selected:
   - ✅ **MSVC v143 - VS 2022 C++ x64/x86 build tools** (latest)
   - ✅ **Windows 11 SDK** (or Windows 10 SDK)
   - ✅ **CMake tools for Windows** (optional but helpful)

4. Click **Install** button (bottom right)

**Installation will take 10-15 minutes**

---

## Step 4: After Installation Completes

Once you see "Installation succeeded" message:

1. Close the installer
2. **Restart PowerShell** (close and reopen)
3. Run this command:

```powershell
$env:PATH = "$env:PATH;$env:USERPROFILE\.cargo\bin"; cd f:\ITT-Orchestrator\backend; cargo build --release
```

**This will compile your backend** (takes 8-10 minutes first time)

---

## Step 5: Verify Build Success

When build completes, you should see:

```
   Compiling itt_api v0.1.0
    Finished release [optimized] target(s) in X.XXs
```

Binary location: `f:\ITT-Orchestrator\backend\crates\itt_api\target\release\itt_api.exe`

---

## Step 6: Start the Backend

After build succeeds:

```powershell
$env:PATH = "$env:PATH;$env:USERPROFILE\.cargo\bin"
cd f:\ITT-Orchestrator\backend\crates\itt_api
.\target\release\itt_api.exe
```

Expected output:
```
🚀 Control Plane listening on http://0.0.0.0:3001
📊 Environment: development
```

---

## 📋 CHECKLIST

- [ ] Installer downloaded (vs_BuildTools.exe)
- [ ] Run as Administrator
- [ ] Selected "Desktop development with C++"
- [ ] Selected MSVC v143 and Windows SDK
- [ ] Installation completed successfully
- [ ] PowerShell restarted
- [ ] Ran: `cargo build --release` (from backend folder)
- [ ] Build succeeded (see "Finished release" message)
- [ ] Backend binary created at `target/release/itt_api.exe`
- [ ] Ran backend: `.\target\release\itt_api.exe`
- [ ] Backend listening on port 3001

---

## 🆘 If Something Goes Wrong

### Build Still Fails After Installing:

```powershell
# Try clearing cargo cache
cargo clean

# Then rebuild
cargo build --release
```

### "cl.exe not found" error:

- Means MSVC wasn't properly installed
- Use Visual Studio Installer (should be in Start menu)
- Click "Modify" next to your installation
- Re-check MSVC tools and reinstall

### Port 3001 Already in Use:

```powershell
netstat -ano | findstr :3001
# Note the PID, then:
taskkill /PID <PID> /F
```

---

## 📊 Timeline

- Download: 2-3 minutes
- Installation: 10-15 minutes  
- Build: 8-10 minutes
- **Total: ~20-30 minutes** ⏱️

---

## ✅ After Everything Works

You'll have:

```
Frontend: http://localhost:3000  ✅ (Already running)
Backend:  http://localhost:3001  ✅ (Just built)
DB:       docker-compose up -d   ⏳ (Optional, for persistence)
```

---

**Start downloading the installer now!**

After installation, come back and run:
```powershell
$env:PATH = "$env:PATH;$env:USERPROFILE\.cargo\bin"; cd f:\ITT-Orchestrator\backend; cargo build --release
```
