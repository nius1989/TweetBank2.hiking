<?php
$param = $_GET['query'];
$solrURL = "http://128.173.239.221:8983/solr/AppalachianTrail_core/select?q=";
$curl = curl_init();
curl_setopt($curl, CURLOPT_URL, $solrURL . $param);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
curl_setopt($curl, CURLOPT_USERAGENT, "mozilla/5.0 (ipad; cpu os 7_0_4 like mac os x) applewebkit/537.51.1 (khtml, like gecko) version/7.0 mobile/11b554a safari/9537.53");
$result = curl_exec($curl);
curl_close($curl);
echo $result;
