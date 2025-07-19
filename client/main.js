const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const readline = require('readline');
const { encrypt, decrypt } = require('./utils');

let serverProcess; // Store the server process reference
const PORT = 3005; // Replace with your server's port

// Function to generate a unique hardware ID
const getHardwareId = () => {
  const cpuId = execSync('wmic cpu get ProcessorId').toString().split('\n')[1].trim();
  const motherboardSerial = execSync('wmic baseboard get serialnumber').toString().split('\n')[1].trim();
  const macAddress = execSync('getmac').toString().split('\n')[0].trim().split(' ')[0];
  console.log(cpuId + '-' + motherboardSerial + '-' + macAddress);
  return `${cpuId}-${motherboardSerial}-${macAddress}`;
};

// Function to create the main application window
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile('index.html');
}

// Function to kill any process running on the specified port
function killProcessOnPort(port) {
  try {
    // Command to find the process running on the port and kill it
    const command = process.platform === 'win32'
      ? `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /F /PID %a`
      : `lsof -t -i:${port} | xargs kill -9`;
    
    execSync(command);
  } catch (err) {
  }
}

// Function to start the server
function startServer() {
  killProcessOnPort(PORT); // Kill any existing process on the port

  const serverPath = path.join(__dirname, 'server', 'server.js');
  serverProcess = exec(`node "${serverPath}"`);

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server output: ${data}`);
    if (data.includes('Server running at')) {
      console.log('Server is running.');
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server error: ${data}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

// Terminate the server when the app is quitting
app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    console.log('Server process terminated.');
  }
});

// Validate the application on startup
app.on('ready', () => {
  const uniqueId = getHardwareId();
  const encryptedUniqueId = encrypt(uniqueId);

  const filePath = path.join(app.getPath('userData'), 'uniqueId.dat');

  if (fs.existsSync(filePath)) {
    const storedEncryptedId = fs.readFileSync(filePath, 'utf8');
    const storedUniqueId = decrypt(storedEncryptedId);

    if (storedUniqueId === uniqueId) {
      console.log('Validation successful, application can run.');
      startServer(); // Start the server before creating the window
      createWindow();
    } else {
      console.log('Validation failed, unauthorized machine.');
      app.quit(); // Or prompt for re-activation
    }
  } else {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    startServer(); // Start the server before creating the window
    createWindow();

    // rl.question('Please enter the unique ID: ', (userInput) => {
    //   if (userInput === uniqueId) {
    //     fs.writeFileSync(filePath, encryptedUniqueId, 'utf8');
    //     console.log('Correct ID. New file created. Application can run.');
    //   } else {
    //     console.log('Incorrect ID. Exiting application.');
    //     app.quit();
    //   }
    //   rl.close();
    // });
  }
});

// Quit the app when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
