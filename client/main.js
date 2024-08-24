const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');
const { encrypt, decrypt } = require('./utils');

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

    rl.question('Please enter the unique ID: ', (userInput) => {
      if (userInput === uniqueId) {
        fs.writeFileSync(filePath, encryptedUniqueId, 'utf8');
        console.log('Correct ID. New file created. Application can run.');
        createWindow();
      } else {
        console.log('Incorrect ID. Exiting application.');
        app.quit();
      }
      rl.close();
    });
  }
});

// Quit the app when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
