<?PHP

header('Content-Type: application/json');
// Get JSON file
$strJson = file_get_contents("./assoc.json");
$array = json_decode($strJson, true);
//var_dump($array); // print array
echo json_encode($strJson);
?>