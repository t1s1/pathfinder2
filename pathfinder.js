/*
global $
global Tabulator
*/

$(document).ready(function() {
  $.get( "data/AA_courses.csv", function( data ) { initCourseData( data, "course-table" ) });
  $.get( "data/AA_certs.csv", function( data ) { initCertData( data, "cert-table" ) });
  $.get( "data/AA_assoc.csv", function( data ) { initAssocData( data, "assoc-table" ) });
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

  var columns = [
    {title: "ID", field: headers[0], width:80},
    {title: "Name", field: headers[1]}
    ]

  var table = new Tabulator("#"+tableName, {
    height: 550, 
    data: data_arr,
    layout: "fitColumns",
    columns: columns,
    rowClick:function(e, row){
      $("#root-choice").val(row.getData()["NAME"]);
      // note that we send the *cert* data obj - we filter by course
      resetAssocTable("course", certData_obj, row.getData()["COURSE_ID"]);
    }
  });
}

function setupCertTable( data_obj, tableName ) {

  var headers = data_obj.headers;
  var data_arr = data_obj.arr;

  var columns = [
    {title:"Name", field:headers[1]}
    ]

  var table = new Tabulator("#"+tableName, {
    height: 550, 
    data: data_arr,
    layout: "fitColumns",
    columns: columns,
    rowClick:function(e, row){
      $("#root-choice").val(row.getData()["NAME"]);
      // note that we send the *course* data obj - we filter by cert
      resetAssocTable("cert", courseData_obj, row.getData()["CERT_ID"]);
    }
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
  var filter = [[]];
  isCourse  = ( selected === "course" );
  
  if (isCourse) {
    columns = [
      { title: "Name", field: certData_obj.headers[1] }
    ];
    // build correct filter
    $.grep(assocData_obj.arr, function( element, i ) {
      console.log(element["COURSE_ID"])
      if (element["COURSE_ID"] === ID) {
        filter[0].push({ 
          field:"CERT_ID", 
          type:"=", 
          value: element["CERT_ID"]
          });
        return true;
      }
    });    
  }
  else {
    columns = [
      { title: "ID", field: courseData_obj.headers[0], width:80 },
      { title: "Name", field: courseData_obj.headers[1] }
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
    });
  }
  
  console.log(filter);
  
  // show filtered version of table
  
  assocTable = new Tabulator("#"+assocTableName, {
    height: 550, 
    data: data_obj.arr,
    movableRows: true, //enable user movable rows
    initialFilter: filter,
    columns: columns
  });
}