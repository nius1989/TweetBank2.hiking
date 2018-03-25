/**
 * Created by Shuo on 10/24/2017.
 */

$.ajaxSetup({
    cache: false
});
//change the debugMode to debug on local client.
//true: direct connect to solr through jquery
//during debugging, the solr protocol must be tuned to localhost. Change the solr protocol in field_config.js to match the ssh forward.
//false: connect to solr through PHP
//this routes the query through PHPRouter on the server
var debugMode = false;

function query_solr(query) {
    if (debugMode) {
        $.getScript(solrURL + 'q=' + query);//for local testing
    } else {
        callSolr(encodeURI(query));//for cluster server
    }
}

//Query the PHP with encoded URI. query routed through PHPSocialNetwork_Jena.php
function query_social_network(query) {
    callJena(encodeURI(query));
}

//Generate solr query fields. These fields will apply to all user searches
function global_constrain() {
    var params =
        globalConstrainField + ':' + globalConstrainParameter + ' AND ' +
        field_cluster + ':' + globalConstrainCluster + ' AND ' +
        field_post_time + ':[' + globalStartDate.toISOString() + ' TO ' + globalEndDate.toISOString() + "]";
    return params;
}


//Configure solr query field based on search bar input.
function global_query(key) {
    if (globalQueryType === field_tweet_content) {
        return field_tweet_content + ":" + key;
    }
    else if (globalQueryType === field_user_name) {
        return "(" + field_user_name + ":" + key + " OR " + field_user_screen_name + ":" + key + ")";
    }
    else if (globalQueryType === field_hastags) {
        return field_hastags + ":" + key;
    }
}

//retrieve the queried term from the returned JSON
function getQueryTerm(queryfield) {
    var term = "";
    queryfield.split(/(AND|OR|\(|\))/).forEach(function (d) {
        if (d.indexOf(field_tweet_content) !== -1
            || d.indexOf(field_user_name) !== -1
            || d.indexOf(field_hastags) !== -1) {
            term = d;
        }
    });
    return term.split(':')[1].trim();
}

//Get all available cluster types from solr. The categories will appear in the dropdown list
function query_solr_cluster() {
    var query = "rows=0&wt=json&indent=true&facet=on&facet.field=" + field_cluster + "&json.wrf=solr_get_cluster_callback";
    query_solr(query);
}

function solr_get_cluster_callback(response) {
    var json = String(JSON.stringify(response));
    var root = JSON.parse(json);
    var rowRoot = root['facet_counts']['facet_fields'][field_cluster];
    var list = [];
    for (var i = 0; i < rowRoot.length; i += 2) {
        list.push({
            value: rowRoot[i],
            text: rowRoot[i]
        })
    }
    loadTopicList(list);
}

//query the solr to retrieve search results for card view and word cloud
function solr_get_new_tweet_list(key) {
    var query =
        global_constrain() +
        " AND " + global_query(key) +
        "&rows=100&wt=json&indent=true&json.wrf=solr_get_search_callback";
    query_solr(query);
    console.log(query);
}

//callback for retrieving search results list
function solr_get_search_callback(response) {
    var json = String(JSON.stringify(response));
    var root = JSON.parse(json);
    var rowRoot = root.response.docs;
    var tweetList = [];
    for (var i = 0; i < rowRoot.length; i++) {
        var tweet = Tweet(rowRoot[i]);
        tweetList.push(tweet);
    }
    var keyList = {};
    tweetList.forEach(function (tweet) {
        // var content = tweet.full_text_ner;
        var content = tweet.full_text.split(' ');
        content.forEach(function (keyword) {
            if (keyList.hasOwnProperty(keyword)) {
                keyList[keyword] += 1;
            } else {
                keyList[keyword] = 1;
            }
        });

    });
    addSolrDataToCardView(tweetList);//return to the CardView
    addSolrDataToWordCloud(keyList);
}

//query the solr to get the num of tweets between the start and end time.
function solr_get_timeline(key, desiredCount) {
    var startDate = new Date(globalStartDate);
    var endDate = new Date(globalEndDate);

    if (startDate >= endDate) {
        return;
    }
    var diffMilli = endDate.getTime() - startDate.getTime();
    var interval = Math.round(diffMilli / (desiredCount - 1));

    var dateTicks = [];
    var currentDate = startDate;
    while (currentDate <= endDate) {
        dateTicks.push(currentDate);
        var newDate = new Date(currentDate.valueOf());
        newDate.setMilliseconds(newDate.getMilliseconds() + interval);
        currentDate = newDate;
    }
    //generate faceted query
    var facets = [];
    for (var i = 0; i < dateTicks.length - 1; i++) {
        facets.push("facet.query=" + field_post_time + ":[" + dateTicks[i].toISOString()
            + " TO " + dateTicks[i + 1].toISOString() + "]");
    }
    var facetQuery = facets.join('&');

    var query;
    query = global_constrain() + " AND " +
        global_query(key) +//content contains the key
        "&facet=true&" + facetQuery +//set facet search
        "&fl=" + field_hastags + //only include hashtags in results for faster query
        "&rows=1&wt=json&indent=true&json.wrf=solr_get_timeline_callback";
    query_solr(query);
    // console.log(query);
}

//callback method for updating timeline
function solr_get_timeline_callback(response) {
    var timeRegex = /(\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})\.000Z/g;
    var json = String(JSON.stringify(response));
    var root = JSON.parse(json);
    var facet_queries_results = root.facet_counts.facet_queries;
    //get the query term
    var queryfield = root.responseHeader.params.q;
    var term = getQueryTerm(queryfield);
    var faceted_results = [];
    for (var key in facet_queries_results) {
        if (facet_queries_results.hasOwnProperty(key)) {
            var matches = key.match(timeRegex);
            var start = new Date(matches[0]);
            var end = new Date(matches[1]);
            var dateTick = new Date((start.getTime() + end.getTime()) / 2);
            faceted_results.push({
                "key": term,
                "value": Number(facet_queries_results[key]),
                "date": dateTick
            });
        }
    }
    addSolrDataToTimeline(faceted_results);
}

//To generate Social network.
function solr_get_social_network(key) {
    var query =
        global_constrain() +
        " AND " + global_query(key) +//content contains the key
        "&fl=" + field_user_id_str + " " + field_user_screen_name + " " + field_user_name + //only include fields in results for faster query
        "&rows=500" +
        "&group=true&group.field=" + field_user_id_str +
        "&wt=json&indent=true";
    query_social_network(query);
}

//Direct query through solr API and generate a partial social network
function solr_get_social_network_debug(key) {
    var connectionQuery = "NOT(" + field_user_mentions_id_str + ":\"\" AND " + field_in_reply_to_user_id_str + ":\"\")";
    var query =
        connectionQuery +
        " AND " + global_constrain() +
        " AND " + global_query(key) +//content contains the key
        "&fl=" + field_user_id_str + " " + field_user_name + field_user_screen_name + " " + field_user_mentions_id_str + " " + field_user_mentions_name + " " + field_user_mentions_screen_name +  //only include fields in results for faster query
        "&sort= " + field_user_followers_count + " DESC" +
        "&rows=800&wt=json&json.wrf=solr_get_social_network_callback_debug";
    query_solr(query);
    console.log(query);
}

//Retrieve faceted user info from solr. To generate bar/pie chart
function solr_get_user_info(key, attr) {
    var facets = [];
    var facetQuery;
    //generate faceted query
    var i;
    if (attr === field_user_followers_count) {
        for (i = 0; i < 8; i++) {
            if (i === 0) {
                facets.push("facet.query=" + field_user_followers_count + ":[" +
                    0 + " TO " + (Math.pow(10, i + 1) - 1) + "]");
            } else {
                facets.push("facet.query=" + field_user_followers_count + ":[" +
                    Math.pow(10, i) + " TO " + (Math.pow(10, i + 1) - 1) + "]");
            }
        }
        facetQuery = facets.join('&');

    } else if (attr === field_user_statuses_count) {
        for (i = 2; i < 7; i++) {
            facets.push("facet.query=" + field_user_statuses_count + ":[" +
                Math.pow(10, i) + " TO " + (Math.pow(10, i + 1) - 1) + "]");
        }
        facetQuery = facets.join('&');
    } else if (attr === field_user_favorite_count) {
        for (i = 0; i < 4; i++) {
            facets.push("facet.query=" + field_user_favorite_count + ":[" +
                Math.pow(10, i) + " TO " + (Math.pow(10, i + 1) - 1) + "]");
        }
        facetQuery = facets.join('&');
    } else if (attr === field_user_friend_count) {
        for (i = 0; i < 6; i++) {
            facets.push("facet.query=" + field_user_friend_count + ":[" +
                Math.pow(10, i) + " TO " + (Math.pow(10, i + 1) - 1) + "]");
        }
        facetQuery = facets.join('&');
    } else if (attr === field_user_lang) {
        facets.push("facet.query=" + field_user_lang + ":en");
        facets.push("facet.query=" + field_user_lang + ":es");
        facets.push("facet.query=" + field_user_lang + ":pt");
        facets.push("facet.query=" + field_user_lang + ":th");
        facets.push("facet.query=" + field_user_lang + ":ko");
        facets.push("facet.query=" + field_user_lang + ":fr");
        facets.push("facet.query=" + field_user_lang + ":ja");
        facets.push("facet.query=" + field_user_lang + ":tr");
        facets.push("facet.query=" + field_user_lang + ":zh");
        facetQuery = facets.join('&');
    }
    var query;
    query = global_constrain() + " AND " +
        global_query(key) +//content contains the key
        "&group=true&group.field=" + field_user_id_str + "&group.facet=true" +//group by user id and do the facet count
        "&facet=true&" + facetQuery +//set facet search
        "&fl=" + attr + //only include hashtags in results for faster query
        "&rows=1&wt=json&indent=true&json.wrf=solr_get_user_info_callback";
    // console.log(solrURL + 'q=' + query);
    query_solr(query);
}

//callback method to get user info
function solr_get_user_info_callback(response) {
    // console.log(response);
    var json = String(JSON.stringify(response));
    var root = JSON.parse(json);
    var facet_queries_results = root.facet_counts.facet_queries;
    //get the query term
    var queryfield = root.responseHeader.params.q;
    var term = getQueryTerm(queryfield);
    var faceted_results = {"key": term};
    //trim the number to simple form
    for (var key in facet_queries_results) {
        if (facet_queries_results.hasOwnProperty(key)) {
            var visKey = key.split('OR')[0].trim().split(':')[1];
            switch (barchart_facet_feild) {
                case field_user_followers_count:
                case field_user_statuses_count:
                case field_user_favorite_count:
                case field_user_friend_count:
                    visKey = visKey.substr(1, visKey.length - 2);
                    visKey = abbreviateNumber(Number(visKey.split('TO')[0])) + " - " + abbreviateNumber(Number(visKey.split('TO')[1]));
                    break;
                case field_user_lang:
                    break;
            }
            faceted_results[visKey] = Number(facet_queries_results[key]);
        }
    }
    addSolrDataToBarChart(faceted_results);
}

//Retrieve faceted user location based on state list
function solr_get_state_location(key) {
    var facets = [];
    var facetQuery;
    //generate faceted query
    var i;
    for (i = 0; i < stateList.length; i++) {
        facets.push("facet.query=" + field_user_location + ":*" + stateList[i][0] + "* OR " +
            field_user_location + ":*" + stateList[i][1] + "*");
    }
    facetQuery = facets.join('&');
    var query;
    query = global_constrain() + " AND " +
        global_query(key) +//content contains the key
        "&facet=true&" + facetQuery +//set facet search
        "&fl=" + field_user_location + //only include hashtags in results for faster query
        "&rows=1&wt=json&indent=true&json.wrf=solr_get_user_state_location_callback";
    query_solr(query);
}

//callback method to get state location.
function solr_get_user_state_location_callback(response) {
    console.log(response);
    var json = String(JSON.stringify(response));
    var root = JSON.parse(json);
    var facet_queries_results = root.facet_counts.facet_queries;
    //get the query term
    var queryfield = root.responseHeader.params.q;
    var term = getQueryTerm(queryfield);
    var faceted_results = [];
    for (var key in facet_queries_results) {
        if (facet_queries_results.hasOwnProperty(key)) {
            var state = key.split('*')[1];
            faceted_results.push({
                "state": state,
                "value": Number(facet_queries_results[key])
            });
        }
    }
    addSolrDateToStateMap({key: term, results: faceted_results});
}

//Retrieve faceted user location based on country list.
function solr_get_place_country_code(key) {
    var query =
        global_constrain() +
        " AND " + field_tweet_content + ":" + key +//content contains the key
        "&facet=on&facet.field=locations" +//set facet search
        // "&facet=on&facet.field=place_country_code" +//set facet search
        "&fl=" + field_user_location + //only include faceted results for faster query
        "&rows=1&wt=json&indent=true&json.wrf=solr_get_place_country_code_callback";
    query_solr(query);
}

//callback method to get country code
function solr_get_place_country_code_callback(response) {
    console.log(response);

    var json = String(JSON.stringify(response));
    var root = JSON.parse(json);
    var facet_queries_results = root.facet_counts.facet_fields[field_user_location];
    //get the query term
    var queryfield = root.responseHeader.params.q;
    var term = getQueryTerm(queryfield);
    var faceted_results = [];
    for (var i = 0; i < facet_queries_results.length; i += 2) {
        faceted_results.push({
            "country": facet_queries_results[i],
            "value": Number(facet_queries_results[i + 1])
        });
    }
    addSolrDateToMap({key: term, results: faceted_results});
}
