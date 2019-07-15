// these need to persist and be accessible

var courseData_obj = {};
var courseTableConfig_obj = {};
var courseTableName;

var certData_obj = {};
var certTableConfig_obj = {};
var certTableName;

var assocTable;
var assocData_obj = {};
var assocRoot_obj = { type:"", ID:"", name:"" };
var assocTableName;

var editMode = function () {
  var isEditor;

  return {
    set: function( setIsEditor ) {
      isEditor = setIsEditor;
    },
    get: function() {
      return( isEditor );
    },
  }
}();

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

/***********************
    COURSE TABLE
************************/
function setupCourseTable( data_obj, tableName ) {

  var courses_headers = data_obj.headers;
  var courses_arr = data_obj.arr;
  var columns;
  
  function addButtonCustomFormatter( cell, formatterParams ){
    return "<button class='btn btn-sm btn-success course-add-button font-weight-bold' >&plus;</button>";
  };
  
  function onAddClick( e, cell ){
    var row = cell.getRow();
    var data = row.getData();
    var assoc_arr  = assocData_obj.arr;
    var certID = assocRoot_obj.ID;
    
    assocTable.addRow( data )
      .then( function( row ) {
        // look for existing
        var found = false;

        $.grep( assoc_arr, function( element, j ) {
          if (element["CERT_ID"] === certID && element["COURSE_ID"] === data["COURSE_ID"] ) {
            found = true;
          return true;
        }
        return false;
        });

        if( !found ){ 
          assocData_obj.arr.push( {"CERT_ID": certID, "COURSE_ID": data["COURSE_ID"]} );
        }
      })
      .catch(function(error){
        alert("Unable to add! Not sure why though...")
      });
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

  columns = editMode.get() ? [
    { title: "ID", field: courses_headers[0], width: 60, cellClick: onSelectClick, headerFilter: true },
    { title:"Name", field: courses_headers[1], cellClick: onSelectClick, headerFilter: true },
    { formatter: addButtonCustomFormatter, width: 40, align:"center", cellClick: onAddClick }
  ] : [
    { title: "ID", field: courses_headers[0], width: 60, cellClick: onSelectClick, headerFilter: true },
    { title:"Name", field: courses_headers[1], cellClick: onSelectClick, headerFilter: true }
  ]

  return {
    data: courses_arr,
    layout: "fitColumns",
    selectable: 1,
    pagination: "local",
    paginationSize: 15,
    columns: columns
  }
}

/***********************
    CERTIFICATION TABLE
************************/
function setupCertTable( data_obj, tableName ) {

  var headers = data_obj.headers;
  var data_arr = data_obj.arr;
  var columns;
  
  function addButtonCustomFormatter( cell, formatterParams ){
    return "<button class='btn btn-sm btn-success cert-add-button font-weight-bold' >&plus;</button>";
  };
  
  function onAddClick( e, cell ){
    var row = cell.getRow();
    var data = row.getData();
    var assoc_arr  = assocData_obj.arr;
    var courseID = assocRoot_obj.ID;

    assocTable.addRow( data )
      .then( function( row ) {
        // look for existing
        var found = false;

        $.grep( assoc_arr, function( element, j ) {
          if (element["COURSE_ID"] === courseID && element["CERT_ID"] === data["CERT_ID"] ) {
            found = true;
            return true;
          }
          return false;
        });

        if( !found ){ 
          assocData_obj.arr.push( { "CERT_ID": data["CERT_ID"], "COURSE_ID": courseID } );
        }
      })
      .catch( function(error){
        alert("Unable to add! Not sure why though...")
      });
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

  columns = editMode.get() ? [
    { title:"Name", field:headers[1], cellClick: onSelectClick, headerFilter: true },
    { formatter: addButtonCustomFormatter, width: 40, align:"center", cellClick: onAddClick }
  ] : [
    { title:"Name", field:headers[1], cellClick: onSelectClick, headerFilter: true }
  ];

  return {
    data: data_arr,
    layout: "fitColumns",
    selectable: 1,
    pagination: "local",
    paginationSize: 15,
    columns: columns
  }
}

function setupAssocTable( tableName ){
  
    // show filtered version of table
  assocTable = new Tabulator("#"+assocTableName, {
    layout:"fitColumns",
    pagination: "local",
    paginationSize: 10,
  });
}

function initCourseData( data, tableName ) {
  courseData_obj = processData( data );
  courseTableName = tableName;
  courseTableConfig_obj = setupCourseTable( courseData_obj, courseTableName );
  new Tabulator("#"+courseTableName, courseTableConfig_obj);
}

function initCertData( data, tableName ) {
  certData_obj = processData( data );
  certTableName = tableName;
  certTableConfig_obj = setupCertTable( certData_obj, certTableName );
  new Tabulator("#"+certTableName, certTableConfig_obj);
}

function refreshTables() {
  new Tabulator("#"+certTableName, certTableConfig_obj);
  new Tabulator("#"+courseTableName, courseTableConfig_obj);
}

function initAssocData( data, tableName ) {
  assocData_obj = processData( data );
  assocTableName = tableName;
  setupAssocTable( assocTableName );
}

/**************************
    RESET ASSOCIATION TABLE
***************************/
function resetAssocTable( selected, data_obj, ID ) {
  
  var columns = [];

  // array within the filter array gives OR, which is good
  var filter = [[{ 
    field:"COURSE_ID", 
    type:"=", 
    value: "0"
    }]]; // starter filter object should give no results


  function onCourseSelectClick( e, cell ){
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
    $("#nav-courses-tab").tab('show');
  }

  function onCertSelectClick( e, cell ){
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
    $("#nav-certs-tab").tab('show');

  }
  
  function deleteButtonCustomFormatter( cell, formatterParams ){
    return "<button class='btn btn-sm btn-danger course-add-button font-weight-bold' >&times;</button>";
  };
  
  function onDeleteClick( e, cell ){
    var row = cell.getRow();
    var data = row.getData();
    var assoc_arr  = assocData_obj.arr;
    var certID, courseID;
    
    if (assocRoot_obj.type === "course") {
      courseID = assocRoot_obj.ID;
      certID = data["CERT_ID"];
    }
    else {
      courseID = data["COURSE_ID"];
      certID = assocRoot_obj.ID;
    }
    
    cell.getRow().delete()
      .then( function( row ) {
        var indexOfMatch;
        // iterate through association array to delete
        $.each( assoc_arr, function( i, obj ){
          // is this the one we want?
          if( obj["COURSE_ID"] === courseID && obj["CERT_ID"] === certID ) {
            indexOfMatch = i; // mark it for deletion
          }
        });
        // delete the correct one
        assoc_arr.splice( indexOfMatch, 1 );
      })
      .catch(function(error){
        alert("Unable to delete! Hmmm...")
      });
  }
  
  // set up root obj
  assocRoot_obj.type = selected;
  assocRoot_obj.ID = ID;
  
  // set up table to show certifications for COURSE
  if (assocRoot_obj.type === "course") {
    assocRoot_obj.name = certData_obj.headers[1];

    columns = editMode.get() ? [
      { title: "Certification Name", field: assocRoot_obj.name, cellClick: onCertSelectClick },
      { formatter: deleteButtonCustomFormatter, width: 40, align:"center", cellClick: onDeleteClick }
    ] : [
      { title: "Certification Name", field: assocRoot_obj.name, cellClick: onCertSelectClick }
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
    columns = editMode.get() ? [
      { title: "ID", field: courseData_obj.headers[0], width: 60 },
      { title: "Course Name", field: assocRoot_obj.name, cellClick: onCourseSelectClick },
      { formatter: deleteButtonCustomFormatter, width: 40, align:"center", cellClick: onDeleteClick }
    ] : [
      { title: "ID", field: courseData_obj.headers[0], width: 60 },
      { title: "Course Name", field: assocRoot_obj.name, cellClick: onCourseSelectClick }
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
    layout:"fitColumns",
    data: data_obj.arr,
    initialFilter: filter,
    columns: columns
  });
}

function downloadJSON( content_arr ) {
  var jsonData = JSON.stringify(content_arr);
  var tempDownloadElement = document.createElement("a");
  var file_blob = new Blob( [jsonData], {type: "json"});
  
  var dateTime = new Date();
  var stamp = dateTime.toLocaleString('en-US', { hour12: false }).replace(/[,:/ ]/g,'');
  var filename = "assoc_data_"+stamp+".json";

  tempDownloadElement.href = URL.createObjectURL(file_blob);
  tempDownloadElement.download = filename;
  tempDownloadElement.click();
}

function downloadCSV( assocData_obj) {
  var headers = assocData_obj.headers;
  var data_arr = assocData_obj.arr;
  
  var csv_str = headers[0]+","+headers[1]+"\n";
  
  var dateTime = new Date();
  var stamp = dateTime.toLocaleString('en-US', { hour12: false }).replace(/[,:/ ]/g,'');
  var filename = "assoc_data_"+stamp+".csv";
  
  var file_blob;

  var tempDownloadElement = document.createElement("a");
  
  function buildCsvRow( a, b ){
    return a +","+ b +"\n";
  }
  
  // first add headers
  csv_str = buildCsvRow( headers[0], headers[1] )

  // then all the data
  $.each( data_arr, function( i, obj ){
    var row = buildCsvRow( obj[headers[0]], obj[headers[1]] );
    csv_str += row;
  });

  file_blob = new Blob( [csv_str], {type: "text/plain"});

  tempDownloadElement.href = URL.createObjectURL(file_blob);
  tempDownloadElement.download = filename;
  tempDownloadElement.click(); // IE: "Access is denied"; see: https://connect.microsoft.com/IE/feedback/details/797361/ie-10-treats-blob-url-as-cross-origin-and-denies-access

}