<?php
/**
 * Created by PhpStorm.
 * User: Shuo
 * Date: 11/28/2017
 * Time: 10:51 AM
 */
$solrURL = "http://10.0.0.125:8983/solr/getar-cs5604f17_shard1_replica1/select?q=";
$jenaURL = "http://mule.dlib.vt.edu:3030/getar/query?query=";
$param = $_GET['query'];
$time_pre = microtime(true);
$field_user_id_str = "user_id_str";
$field_user_name = "user_name";
$field_user_screen_name = "user_screen_name";
$field_user_mention_id = "user_mentions_id_str";

//Get the list of documents, whose Twitters are unique, and retrieve the user id
//The selection params are configured in "solr_get_social_network" of SOLRAPI
$result = curlSolr($solrURL, $param);
$json = json_decode($result, true);
$rowRoot = $json['grouped'][$field_user_id_str]['groups'];
$nodeList = array();
$linkList = array();
$ids = array();//saves unique ids
for ($i = 0; $i < count($rowRoot); $i++) {
    $ids[$rowRoot[$i]['doclist']['docs'][0][$field_user_id_str]] = false;
}
//For each single user, get his connected users.
//urls list generate Jena urls to get the connected users
$urls = array();
foreach ($ids as $id => $value) {
    $q = "prefix sub: <http://example.org/> " .
        "prefix pred:<http://xmlns.com/SNR/0.1/> " .
        "SELECT ?" . $id . " WHERE {?" . $id . " " .
        "pred:mentions \"" . $id . "\"} LIMIT 20000";
    array_push($urls, $jenaURL . encodeURIComponent($q));
}
//Parallel execution of the URL. multiCurlJena queries SOLR API and get the connected users.
//Map method
$linkResults = multiCurlJena($urls);
for ($i = 0; $i < count($linkResults); $i++) {
    $js = json_decode(trim($linkResults[$i]), true);
    $sourceID = $js['head']['vars'][0];
    $bindings = $js['results']['bindings'];
    if (count($bindings) > 0) {
        foreach ($bindings as $binding) {
            $targetID = $binding[$sourceID]['value'];
            $targetID = substr($targetID, strlen('http://example.org/'));
            if (array_key_exists($targetID, $ids) && $sourceID != $targetID) {
                $link = array(
                    "source" => $sourceID,
                    "target" => $targetID,
                    "value" => 1
                );
                if (!checkExist($linkList, $link)) {
                    array_push($linkList, $link);
                    $ids[$link['source']] = true;
                    $ids[$link['target']] = true;
                }
            }
        }
    }
}
////Save the connections in hash.
////Reduce method
for ($i = 0; $i < count($rowRoot); $i++) {
    $node = array(
        "id" => $rowRoot[$i]['doclist']['docs'][0][$field_user_id_str],
        "group" => 1,
        "name" => $rowRoot[$i]['doclist']['docs'][0][$field_user_name],
        "screenname" => $rowRoot[$i]['doclist']['docs'][0][$field_user_screen_name]
    );
    if ($ids[$node['id']]) {
        array_push($nodeList, $node);
    }
}
$jResult = array(
    "nodes" => $nodeList,
    "links" => $linkList
);
//$time_post = microtime(true);
//echo ($time_post - $time_pre) . "\n" . json_encode($linkResults);
echo "addSolrDataToSocialLink(" . json_encode($jResult) . ")";

function checkExist($list, $link)
{
    foreach ($list as $tlink) {
        if (($tlink["source"] == $link["source"] && $tlink["target"] == $link["target"])
            || ($tlink["source"] == $link["target"] && $tlink["target"] == $link["source"])) {
            return true;
        }
    }
    return false;
}

function multiCurlJena($urls)
{
    $res = array();
    $step = 100;
    for ($i = 0; $i < count($urls); $i += $step) {
        $r = multiCurlJenaByRange($urls, $i, ($i + $step) < count($urls) ? ($i + $step) : count($urls));
        $res = array_merge($res, $r);
    }
    return $res;
}

function multiCurlJenaByRange($urls, $start, $end)
{
    //create the multiple cURL handle
    $mh = curl_multi_init();
    $curlArray = array();
    $res = array();
    for ($i = $start; $i < $end; $i++) {
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_URL, $urls[$i]);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
        curl_setopt($curl, CURLOPT_USERAGENT, "mozilla/5.0 (ipad; cpu os 7_0_4 like mac os x) applewebkit/537.51.1 (khtml, like gecko) version/7.0 mobile/11b554a safari/9537.53");
        //add the handles
        curl_multi_add_handle($mh, $curl);
        array_push($curlArray, $curl);
    }

    $active = null;
    //execute the handles
    do {
        $mrc = curl_multi_exec($mh, $active);
    } while ($mrc == CURLM_CALL_MULTI_PERFORM);

    while ($active && $mrc == CURLM_OK) {
        if (curl_multi_select($mh) != -1) {
            do {
                $mrc = curl_multi_exec($mh, $active);
            } while ($mrc == CURLM_CALL_MULTI_PERFORM);
        }
    }
    for ($i = 0; $i < count($curlArray); $i++) {
        $res[$i] = curl_multi_getcontent($curlArray[$i]); // get the content
        curl_multi_remove_handle($mh, $curlArray[$i]);
    }
    curl_multi_close($mh);
    return $res;
}

//
///**
// * @param $solrURL
// * @param $query
// * @return int
// */
function curlSolr($url, $query)
{
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url . $query);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
    curl_setopt($curl, CURLOPT_USERAGENT, "mozilla/5.0 (ipad; cpu os 7_0_4 like mac os x) applewebkit/537.51.1 (khtml, like gecko) version/7.0 mobile/11b554a safari/9537.53");
    $result = curl_exec($curl);
    curl_close($curl);
    return $result;
}

//url must be encoded to get the correct result
///**
// * @param $str
// * @return string
// */
function encodeURIComponent($str)
{
    $revert = array('%21' => '!', '%2A' => '*', '%26' => '&', '%27' => "'", '%28' => '(', '%29' => ')', '%3D' => '=', '%3F' => '?');
    return strtr(rawurlencode($str), $revert);
}