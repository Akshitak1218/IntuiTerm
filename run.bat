@echo off
echo Starting IntuiTerm...

echo Installing backend dependencies...
cd backend
pip install -r requirements.txt

echo Starting backend server...
start "IntuiTerm Backend" cmd /c "uvicorn main:app --host 0.0.0.0 --port 7681 --reload"

echo Starting frontend...
cd ../frontend
call npm install
start "IntuiTerm Frontend" cmd /c "npm run dev"

echo IntuiTerm is running!
pause
