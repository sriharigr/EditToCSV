// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const fs = require('fs');
const csv = require('csv-parser')
const fastcsv = require('fast-csv');
const _ = require('lodash');
const { dialog } = require('electron').remote;
const log = require('electron-log');


let tableRef = document.getElementById("csvTable"); //holds DOM element reference of the table
let addRowBtnRef = document.getElementById("addRowBtn"); //holds DOM element reference for Add Row Button
let exportBtnRef = document.getElementById("exportBtn"); //holds DOM element reference for Export Button
let uploadBtnRef = document.getElementById("uploadBtn"); //holds DOM element reference for Upload Button
let saveBtnRef = document.getElementById("saveBtn"); //holds DOM element reference for Save Button

let deletedRowIds = [];
var csvData = [];
var headers = [];
var filePath = "";
var isFileSelected = false;


function init() {
    try {
        addRowBtnRef.addEventListener('click', addRow);
        exportBtnRef.addEventListener('click', exportAsCSV);
        uploadBtnRef.addEventListener('click', uploadFile);
        saveBtnRef.addEventListener('click', save);
        addRowBtnRef.style.visibility = 'hidden';
        saveBtnRef.style.visibility = 'hidden';
        exportBtnRef.style.visibility = 'hidden';
    } catch (error) {
        log.warn('Something went wrong during - init()', JSON.stringify(error.message));
    } finally {
    }
}

function readData() {
    try {
        csvData = [];
        fs.createReadStream(filePath)
            .pipe(csv({ raw: true }))
            .on('data', (data) => csvData.push(data))
            .on('end', () => {
                headers = _.keys(csvData[0]);
                renderTableHeader();
                renderTableContent();
            });
    } catch (error) {
        log.warn('Something went wrong during - readData()', JSON.stringify(error.message));
    }

}

function renderTableHeader() {
    try {
        var hr = tableRef.createTHead();
        var hrCellIndex = 0;
        var hrRow = hr.insertRow(0);
        headers.map((header) => {
            hrRow.insertCell(hrCellIndex).innerHTML = `<b>${header}<b>`;
            hrCellIndex++;
        });
    } catch (error) {
        log.warn('Something went wrong during - renderTableHeader()', JSON.stringify(error.message));
    }
}

function renderTableContent() {
    try {
        var rowIndex = 1;
        csvData.map((result) => {
            var row = tableRef.insertRow(rowIndex);
            var cellIndex = 0;
            _.values(result).map((value) => {
                let element = row.insertCell(cellIndex);
                element.innerHTML = `<input type="text" id=${(rowIndex - 1) + "" + cellIndex} value='${value}'>`;
                cellIndex++;
            });
            // cellIndex++; 
            // let elementTwo = row.insertCell(cellIndex);
            // elementTwo.innerHTML = `<button id=${rowIndex-1} onclick="getIndex(this)">Delete</button>`;
            // elementTwo.addEventListener('click', handleDeleteEvent);
            rowIndex++
        });
        addRowBtnRef.style.visibility = 'visible';
        saveBtnRef.style.visibility = 'visible';
        exportBtnRef.style.visibility = 'visible';

    } catch (error) {
        log.warn('Something went wrong during - renderTableContent()', JSON.stringify(error.message));
    }
}

function addRow() {
    try {
        var rowIndex = csvData.length + 1;
        var newRow = tableRef.insertRow(rowIndex);
        var cellIndex = 0;
        headers.map((header) => {
            if (header != 'Action') {
                let element = newRow.insertCell(cellIndex);
                element.innerHTML = `<input type="text" id=${(rowIndex - 1) + "" + cellIndex}>`;
                cellIndex++;
            }
        });
    } catch (error) {
        log.warn('Something went wrong during - addRow()', JSON.stringify(error.message));
    }
    // element.scrollIntoView();    // use this to scroll into view
    // csvData.push(createNewRecord());
}

function save(event) {
    try {
        saveBtnRef.disabled = true;
        var updatedData = [];
        var updatedObject = {};
        var propertyIndex = 0;
        for (var i = 1; i < tableRef.rows.length; i++) {
            var clonedObj = _.clone(updatedObject);
            headers.map((header) => {
                clonedObj[header] = tableRef.rows[i].cells[propertyIndex].children[0].value;
                propertyIndex++;
            });
            propertyIndex = 0;
            updatedData.push(clonedObj);
        }
        csvData = _.clone(updatedData);
        dialog.showMessageBox(null,{type: 'info', title: 'Success', message: 'Saved Successfully!', buttons: ['Close']});
    } catch (error) {
        log.warn('Something went wrong during - save()', JSON.stringify(error.message));
    } finally {
        saveBtnRef.disabled = false;
    }
}



function handleDeleteEvent(event) {
    try {
        const element = event.target;
        var rowNo = Number(element.id);
        dialog.showMessageBox(null, { type: 'warning', title: 'Delete', message: 'Are you sure you want to delete it?', buttons: ['Yeah, I wanna!', 'Oops, no!'] }, (response, checkboxChecked) => {
            if (response == '0' || response == 0) {
                deletedRowIds.push(rowNo);
            } else {
                log.warn('Oops! That was by mistake');
            }
        });
    } catch (error) {
        log.warn('Something went wrong during - handleDeleteEvent()', JSON.stringify(error.message));
    }
}

function deleteRows(callback) {
    try {
        var deletedRows = 0;
        for (var i = 1; i < tableRef.rows.length; i++) {
            tableRef.deleteRow(i);
        }
    } catch (error) {
        log.warn('Something went wrong during - deleteRows()', JSON.stringify(error.message));
    }
}

function createNewRecord() {
    try {
        let newRecord = {};
        headers.map((header) => {
            if (header != 'Action') {
                newRecord[header] = "";
            }
        });
        return newRecord;
    } catch (error) {
        log.warn('Something went wrong during - createNewRecord()', JSON.stringify(error.message));
    }
}

function exportAsCSV() {
    try {
        exportBtnRef.disabled = true;
        if (isFileSelected) {
            dialog.showSaveDialog(null, { defaultPath: '.csv' }, (response) => {
                fastcsv.writeToPath(response, csvData, {
                    headers: true
                })
                    .on("finish", function () {
                        dialog.showMessageBox(null, { title: 'Success', type: 'info', message: 'Data exported successfully!', buttons: ['Close'], })
                    });
            })
        } else {
            dialog.showErrorBox('Error', 'Please select a valid CSV file');
        }
    } catch (error) {
        log.warn('Something went wrong during - exportAsCSV()', JSON.stringify(error.message));
    } finally {
        exportBtnRef.disabled = false;
    }
}

function uploadFile() {
    try {
        uploadBtnRef.disabled = true;
        dialog.showOpenDialog(null, {}, (response) => {
            if (response[0] != "") {
                var sFNme = response[0]; //selectedFileName
                if (sFNme.substring(sFNme.lastIndexOf('.') + 1, sFNme.length) == 'csv') {
                    init();
                    isFileSelected = true;
                    filePath = response[0];
                    if (tableRef.rows.length > 1) {
                        deleteRows(() => {
                            log.warn('Deleted all the rows');
                        })
                    } else {
                        readData();
                    }
                } else {
                    dialog.showErrorBox('Error', 'Invalid File Format - Valid Format is CSV');
                }
            }
        });
    } catch (error) {
        log.warn('Something went wrong during - uploadFile()', JSON.stringify(error.message));
    } finally {
        uploadBtnRef.disabled = false;
    }
}

init();

