@echo off
chcp 65001 >nul
cls
cd /d "%~dp0"

echo ========================================================
echo  [3단계] 프로그램 자동 업데이트 도구
echo ========================================================
echo.

:: 1. update.zip 파일이 있는지 확인
if not exist "update.zip" (
    echo [오류] 'update.zip' 파일이 없습니다!
    echo.
    echo 1. 보내준 업데이트 압축 파일 이름을 'update.zip'으로 바꿔주세요.
    echo 2. 이 폴더 안에 'update.zip'을 넣고 다시 실행해주세요.
    echo.
    pause
    exit /b
)

echo update.zip 파일을 감지했습니다.
echo 프로그램을 업데이트합니다... 
echo.

:: 2. 기존 DB 안전 백업 (추가됨)
echo [1/4] 소중한 기존 데이터(workspace.db)를 백업 중입니다...
if exist "workspace.db" (
    copy /y workspace.db workspace_backup.db >nul
    echo   -^> 기존 데이터가 workspace_backup.db로 안전하게 보호되었습니다.
) else (
    echo   -^> 기존 DB 파일이 없어 백업을 건너뜁니다.
)
echo.

:: 3. 파워쉘을 이용해 강제 덮어쓰기 압축 해제
echo [2/4] 업데이트 파일을 덮어쓰는 중입니다...
powershell -command "Expand-Archive -Path 'update.zip' -DestinationPath '.' -Force"
if %errorlevel% neq 0 (
    echo [오류] 압축을 푸는 도중 문제가 발생했습니다.
    pause
    exit /b
)
echo.

:: 4. 새로운 라이브러리 설치
echo [3/4] 추가된 기능에 필요한 파일을 정리 중입니다...
call npm install
if %errorlevel% neq 0 (
    echo [오류] npm install 중 문제가 발생했습니다.
    pause
    exit /b
)
echo.

:: 5. 코드 빌드 (server.ts 사용 환경)
echo [4/4] 변경된 코드를 시스템에 적용(빌드)합니다...
call npm run build
echo.

:: 6. 완료 메시지
echo ========================================================
echo  ✅ 업데이트가 성공적으로 완료되었습니다!
echo ========================================================
pause