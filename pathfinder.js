/*
global $
global Tabulator
*/

$(document).ready(function() {
  $.get( "data/AA_courses.csv", function( data ) { initCourseData( data, "course-table" ) });
  $.get( "data/AA_certs.csv", function( data ) { initCertData( data, "cert-table" ) });
  $.get( "data/AA_assoc.csv", function( data ) { initAssocData( data, "assoc-table" ) });
  /*$.getJSON("data/assoc.json", function( json ) {
      alert("ok");
  });
  assocTable.setData("./data/assoc_JSON.php");
  */
  
  $("#download-csv").click( function() {
    assocTable.download("csv", "data.csv");
  });
  $("#save-data").click( function() {
    writeAssocData();
  });
});

const tableHeight = 500;

// these need to persist and be accessible
var courseData_obj = {};
var certData_obj = {};

var assocTable;
var assocData_obj = {};
var assocRoot_obj = { type:"", ID:"", name:"" };
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
    // set type
    $("#root-type").text("COURSE");
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
    height: tableHeight,
    data: data_arr,
    layout: "fitColumns",
    pagination: "local",
    paginationSize:10,
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
    // set type
    $("#root-type").text("CERTIFICATION");
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
    height: tableHeight, 
    data: data_arr,
    layout: "fitColumns",
    pagination:"local",
    paginationSize:10,
    columns: columns
  });
}

function setupAssocTable( tableName ){
  
    // show filtered version of table
  assocTable = new Tabulator("#"+assocTableName, {
    layout:"fitColumns",
    height: tableHeight-30
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
  setupAssocTable( assocTableName );
}

function writeAssocData() {
  var newAssoc_arr = [];
  var filteredData_arr  = assocTable.getData(true); // true for filtered only
  //var data = JSON.stringify(filteredData_arr);
  
  function newAdditions( old_arr, new_arr ) {
    var newElements_arr = [];
    // find matches - if matched then we don't need to add it
    // iterate through filtered assoc array
    $.each( new_arr, function( i, obj ){
      var found = false;
      // find match in unfiltered assoc array (all existing associations)
      $.grep( old_arr, function( element, j ) {
        if (element["COURSE_ID"] === obj["COURSE_ID"] && element["CERT_ID"] === obj["CERT_ID"] ) {
          found = true;
          return true;
        }
        return false;
      }); 
      if( !found ){ newElements_arr.push(obj)}
    });

    return $.merge( old_arr, newElements_arr );
  }
  
  function newDeletions( old_arr, new_arr, key, value ){
    var updated_arr = Array.from(old_arr);
    var key2 = (key === "COURSE_ID") ? "CERT_ID" : "COURSE_ID";

    // iterate through original array
    $.each( old_arr, function( i, obj ){
      console.log(obj)
      // only check the correct ID
      if( obj[key] === value ){
        var found = false;
        // search in new filtered array (maybe deletions)
        $.grep( new_arr, function( element, j ) {
          if (element[key] === obj[key] && element[key2] === obj[key2] ) {
            found = true;
            return true;
          }
          return false;
        });
        // remove 
        if( !found ){ 
          updated_arr.splice( i, 1 )
        }
      }
    });

    return updated_arr;
  }
  
  if( assocRoot_obj.type === "course" ){
    // create new array of objects
    $.each(filteredData_arr, function(i, obj){
      newAssoc_arr.push({COURSE_ID: assocRoot_obj.ID, CERT_ID: obj.CERT_ID})
    });
    // first delete
    assocData_obj.arr = newDeletions( assocData_obj.arr, newAssoc_arr, "COURSE_ID", assocRoot_obj.ID );
    // then add new
    assocData_obj.arr = newAdditions( assocData_obj.arr, newAssoc_arr );
  }
  else {
    // create new array of objects
    $.each(filteredData_arr, function(i, obj){
      newAssoc_arr.push({CERT_ID: assocRoot_obj.ID, COURSE_ID: obj.COURSE_ID})
    });
    // first delete
    assocData_obj.arr = newDeletions( assocData_obj.arr, newAssoc_arr, "CERT_ID", assocRoot_obj.ID );
    // then add new
    assocData_obj.arr = newAdditions( assocData_obj.arr, newAssoc_arr );   
  }

}

function resetAssocTable( selected, data_obj, ID ) {
  
  var columns = [];

  // array within the filter array gives OR, which is good
  var filter = [[{ 
    field:"COURSE_ID", 
    type:"=", 
    value: "0"
    }]]; // starter filter object should give no results
  
  // set up root obj
  assocRoot_obj.type = selected;
  assocRoot_obj.ID = ID;
  
  // set up table to show certifications for COURSE
  if (assocRoot_obj.type === "course") {
    assocRoot_obj.name = certData_obj.headers[1];
    columns = [
      { title: "Name", field: assocRoot_obj.name },
      { formatter:"buttonCross", width:40, align:"center", cellClick:function(e, cell) { cell.getRow().delete(); }}
    ];
    // build correct filter
    $.grep(assocData_obj.arr, function( element, i ) {
      if (element["COURSE_ID"] === assocRoot_obj.ID) {
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
    assocRoot_obj.name = courseData_obj.headers[1];
    columns = [
      { title: "ID", field: courseData_obj.headers[0], width:80 },
      { title: "Name", field: assocRoot_obj.name },
      { formatter:"buttonCross", width:40, align:"center", cellClick:function(e, cell) { cell.getRow().delete(); }}
    ];
    // build correct filter
    $.grep(assocData_obj.arr, function( element, i ) {
      if (element["CERT_ID"] === assocRoot_obj.ID) {
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
    height: tableHeight-30, 
    layout:"fitColumns",
    pagination:"local",
    paginationSize:10,
    data: data_obj.arr,
    //movableRows: true,
    initialFilter: filter,
    columns: columns
  });
}