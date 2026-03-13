@echo off
set "JAVA_HOME=C:\Users\cobek\.jdks\ms-21.0.10"
set "ANDROID_HOME=C:\Users\cobek\AppData\Local\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"
cd /d "%~dp0"
call npx react-native start --port 8081
