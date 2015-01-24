<?php

$data = $_POST['image'];
$data = base64_decode($data);

$uniqid = uniqid();
file_put_contents($uniqid.".jpg", $data);
echo "http://routefiftyfive.com/huggr/".$uniqid.".jpg";

?>