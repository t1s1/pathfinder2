/*
global $
global Tabulator
*/

$(document).ready(function() {
  $.get( "data/AA_courses.csv", function( data ) { setupCourseTable(data, "course-table") });
  $.get( "data/AA_certs.csv", function( data ) { setupCertTable(data, "cert-table") });
  $.get( "data/AA_assoc.csv", function( data ) { setupAssocTable(data, "assoc-table") });
});

var assocTable;

function processData( data, tableName ) {
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

function setupCourseTable( data, tableName ) {
  
  var data_obj = processData( data, tableName );
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
      assocTable.setFilter("COURSE_ID", "=", row.getData()["COURSE_ID"]);
    }
  });
}

function setupCertTable( data, tableName ) {
  
  var data_obj = processData( data, tableName );
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
      assocTable.setFilter("CERT_ID", "=", row.getData()["CERT_ID"]);
    }
  });
}

function setupAssocTable( data, tableName ) {
  
  var data_obj = processData( data, tableName );
  var headers = data_obj.headers;
  var data_arr = data_obj.arr;

  var columns = [
    {title:"COURSE", field:headers[0], width:160},
    {title:"CERT", field:headers[1], width:160}
    ]
  
  assocTable = new Tabulator("#"+tableName, {
    height: 550, 
    data: data_arr,
    movableRows: true, //enable user movable rows
    columns: columns,
    rowClick:function(e, row){ //trigger an alert message when the row is clicked
        // console.log(row.getData());
      },
  });
}