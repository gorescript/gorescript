"use strict";

const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindow;

function createWindow () {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 720,
		title: "gorescript",
		frame: false
	});

	mainWindow.loadURL("file://" + __dirname + "/index.html");

	// @if DEBUG=true
	mainWindow.webContents.openDevTools();
	// @endif

	mainWindow.on("closed", function() {
		mainWindow = null;
	});
}

app.on("ready", createWindow);

app.on("window-all-closed", function () {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", function () {
	if (mainWindow === null) {
		createWindow();
	}
});