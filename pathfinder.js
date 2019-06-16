/*
global $
global Tabulator
*/

$(document).ready(function() {
  $.get( "data/AA_courses.csv", function( data ) { initCourseData( data, "course-table" ) });
  $.get( "data/AA_certs.csv", function( data ) { initCertData( data, "cert-table" ) });
  $.get( "data/AA_assoc.csv", function( data ) { initAssocData( data, "assoc-table" ) });
  
  $("#download-csv").click( function() {
    assocTable.download("csv", "data.csv");
  });
});


// these need to persist and be accessible
var courseData_obj = {};
var certData_obj = {};

var assocTable;
var assocData_obj = {};
var assocTableName;

function processData( data ) {
  var dataRows = data.split(/\r\n|\n/);
  var headers = dataRows[0].split(',');
  var data_arr = [];

  function removeQuoteMarks(string) {
    return string.replace(/"/g,'');
  };

  for (var i=1; i<dataRows.length; i++) {
    var data = dataRows[i].split(',');
    if (data.length == headers.length) {
      var row = {};
      for (var j=0; j<headers.length; j++) {
        row[headers[j]] = removeQuoteMarks(data[j]);
      }
      data_arr.push(row);
    }
  };

  return { "arr": data_arr, "headers": headers };
}

function setupCourseTable( data_obj, tableName ) {

  var headers = data_obj.headers;
  var data_arr = data_obj.arr;
  
  function addButtonCustomFormatter( cell, formatterParams ){
    return "<button class='btn btn-sm btn-success course-add-button font-weight-bold' >&plus;</button>";
  };
  
  function onAddClick( e, cell ){
    var row = cell.getRow();
    assocTable.addRow(row.getData());
  }

  function onSelectClick( e, cell ){
    var row = cell.getRow();
    // set header of association table
    $("#root-choice").val(row.getData()["NAME"]);
    // note that we send the *cert* data obj - we filter by course
    resetAssocTable("course", certData_obj, row.getData()["COURSE_ID"]);
    // disable the course ADD buttons and enable cert ADD buttons
    $(".course-add-button").prop('disabled', true);
    $(".cert-add-button").prop('disabled', false);
  }

  var columns = [
    {title: "ID", field: headers[0], width:80, cellClick: onSelectClick},
    { title:"Name", field:headers[1], cellClick: onSelectClick },
    { formatter: addButtonCustomFormatter, width:60, align:"center", cellClick: onAddClick }
    ]

  var table = new Tabulator("#"+tableName, {
    height: 550, 
    data: data_arr,
    layout: "fitColumns",
    columns: columns
  });
}

function setupCertTable( data_obj, tableName ) {

  var headers = data_obj.headers;
  var data_arr = data_obj.arr;
  
  function addButtonCustomFormatter( cell, formatterParams ){
    return "<button class='btn btn-sm btn-success cert-add-button font-weight-bold' >&plus;</button>";
  };
  
  function onAddClick( e, cell ){
    var row = cell.getRow();
    assocTable.addRow(row.getData());
  }

  function onSelectClick( e, cell ){
    var row = cell.getRow();
    // set header of association table
    $("#root-choice").val(row.getData()["NAME"]);
    // note that we send the *course* data obj - we filter by cert
    resetAssocTable("cert", courseData_obj, row.getData()["CERT_ID"]);
    // disable the cert ADD buttons and enable course ADD buttons
    $(".cert-add-button").prop('disabled', true);
    $(".course-add-button").prop('disabled', false);
  }

  var columns = [
    { title:"Name", field:headers[1], cellClick: onSelectClick },
    { formatter: addButtonCustomFormatter, width:60, align:"center", cellClick: onAddClick }
    ]

  var table = new Tabulator("#"+tableName, {
    height: 550, 
    data: data_arr,
    layout: "fitColumns",
    columns: columns
    //movableRows: true,
    //movableRowsConnectedTables: "#assoc-table",
    //rowClick:function(e, row){}
  });
}

function initCourseData( data, tableName ) {
  courseData_obj = processData( data );
  setupCourseTable( courseData_obj, tableName );
}


function initCertData( data, tableName ) {
  certData_obj = processData( data );
  setupCertTable( certData_obj, tableName );
}


function initAssocData( data, tableName ) {
  assocData_obj = processData( data );
  assocTableName = tableName;
}

function resetAssocTable( selected, data_obj, ID ) {
  
  var columns = [];
  var isCourse = false;
  // array within the filter array gives OR, which is good
  var filter = [[{ 
    field:"COURSE_ID", 
    type:"=", 
    value: "0"
    }]]; // starter filter object should give no results
    
  isCourse  = ( selected === "course" );
  
  /*
  function customReceiver(fromRow, toRow, fromTable){
    //fromRow - the row component from the sending table
    //toRow - the row component from the receiving table (if available)
    //fromTable - the Tabulator object for the sending table
    
    // we don't want it if it's from the same table we selected from originally
    if( (isCourse && fromTable.id === "course-table") || (!isCourse && fromTable.id === "cert-table") ) {
      return false;
    }
    else {
      this.table.addRow(fromRow.getData());
      return true;
    }
    
  }
  */
  
  // set up table to show certifications for COURSE
  if (isCourse) {
    columns = [
      { title: "Name", field: certData_obj.headers[1] },
      { formatter:"buttonCross", width:40, align:"center", cellClick:function(e, cell) { cell.getRow().delete(); }}
    ];
    // build correct filter
    $.grep(assocData_obj.arr, function( element, i ) {
      if (element["COURSE_ID"] === ID) {
        filter[0].push({ 
          field:"CERT_ID", 
          type:"=", 
          value: element["CERT_ID"]
          });
        return true;
      }
      return false;
    });    
  }
  // set up table to show courses for CERTIFICATION
  else {
    columns = [
      { title: "ID", field: courseData_obj.headers[0], width:80 },
      { title: "Name", field: courseData_obj.headers[1] },
      { formatter:"buttonCross", width:40, align:"center", cellClick:function(e, cell) { cell.getRow().delete(); }}
    ];
    // build correct filter
    $.grep(assocData_obj.arr, function( element, i ) {
      if (element["CERT_ID"] === ID) {
        filter[0].push({ 
          field:"COURSE_ID", 
          type:"=", 
          value: element["COURSE_ID"]
          });
        return true;
      }
      return false;
    });
  }
  
  // show filtered version of table
  
  assocTable = new Tabulator("#"+assocTableName, {
    height: 550, 
    layout:"fitColumns",
    data: data_obj.arr,
    //movableRowsReceiver: customReceiver,
    movableRows: true,
    initialFilter: filter,
    columns: columns
  });
}