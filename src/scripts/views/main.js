// Load dataset from backend, and generate clusters and networks.

//global limitation queries
var globalStartDate = new Date('2015-01-01T00:00:00Z');//from this time
var globalEndDate = new Date('2016-01-01T00:00:00Z');//to this time
var globalQuery = '*';//search word
var globalQueryType = field_tweet_content;
var globalQueryHistory = [];
var globalConstrainField = "*";//the field to limit the value
var globalConstrainParameter = "[* TO *]";//the field parameter
var globalConstrainCluster = "*";
$(document).ready(function () {
    document.getElementById('constrain-list').selectedIndex = "0";
    document.getElementById('constrain-query-type').selectedIndex = "0";
    document.getElementById("barchart-checkbox").checked = false;
    document.getElementById("timeline-checkbox").checked = false;
    query_solr_cluster();
    showSubList(0);
    perform_search();
});

document.getElementById("search_box").addEventListener("keydown", function (e) {
    // Enter is pressed
    if (e.keyCode === 13) {
        perform_search();
    }
}, false);

$('input[name="daterange"]').daterangepicker({
        timePicker: true,
        timePickerIncrement: 30,
        locale: {
            format: 'MM/DD/YYYY HH:mm'
        },
        startDate: globalStartDate,
        endDate: globalEndDate
    },
    function (start, end, label) {
        globalStartDate = new Date(start);
        globalEndDate = new Date(end);
        perform_search();
    });

function loadTopicList(cluster_list) {
    var list = $('#constrain-query-cluster').empty();
    list.append($('<option>', {value: '*', text: 'All clusters'}));
    cluster_list.forEach(function (t) {
        list.append($('<option>', {
            value: t.value,
            text: t.text
        }));
    });
}

function getAttributeByIndex(index) {

    switch (index) {
        case 0:
            return field_user_followers_count;
        case 1:
            return field_user_friend_count;
        case 2:
            return field_user_statuses_count;
        case 3:
            return field_user_favorite_count;
        case 4:
            return field_user_lang;
        default:
            return '*';
    }
}

function setQueryType(attr) {
    switch (attr) {
        case 0:
            globalQueryType = field_tweet_content;
            break;
        case 1:
            globalQueryType = field_user_name;
            break;
        case 2:
            globalQueryType = field_hastags;
            break;
    }
    perform_search();
}

function setQueryCluster(attr) {
    globalConstrainCluster = attr;
    perform_search();
}

function showSubList(attr) {
    globalConstrainField = getAttributeByIndex(attr);
    var list = $('#constrain-sub-list').empty();
    if (globalConstrainField === field_user_followers_count) {
        constrainAppendToList(list, 0, 8);
    } else if (globalConstrainField === field_user_statuses_count) {
        constrainAppendToList(list, 2, 7);
    } else if (globalConstrainField === field_user_favorite_count) {
        constrainAppendToList(list, 0, 4);
    } else if (globalConstrainField === field_user_friend_count) {
        constrainAppendToList(list, 0, 6);
    } else if (globalConstrainField === field_user_lang) {
        list.append($('<option>', {value: '', text: 'Reset'}));
        var lang = ['en', 'es', 'pt', 'th', 'ko', 'fr', 'ja', 'tr', 'zh'];
        var lang_text = ['English', 'Español', 'Português', 'Thai', 'Korean', 'French', 'Japanese', 'Turkish', 'Chinese (中文)'];
        for (var i = 0; i < lang.length; i++)
            list.append($('<option>', {
                value: lang[i],
                text: lang_text[i]
            }));
    }
}

function constrainAppendToList(list, start, end) {
    list.append($('<option>', {value: '*', text: 'Reset'}));
    for (var i = start; i < end; i++) {
        list.append($('<option>', {
            value: '[' + Math.pow(10, i) + " TO " + (Math.pow(10, i + 1) - 1) + ']',
            text: abbreviateNumber(Math.pow(10, i)) + " TO " + abbreviateNumber(Math.pow(10, i + 1) - 1)
        }));
    }
}

function updateConstrainSelect(op) {
    globalConstrainParameter = op.value;
    perform_search();
}

// Close the dropdown if the user clicks outside of it
window.onclick = function (event) {
    if (!event.target.matches('.barchart-dropbtn')) {

        var dropdowns = document.getElementsByClassName("barchart-dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

function perform_search() {
    globalQuery = $('#search_box').val().trim();
    if (globalQuery === "") {
        globalQuery = "*";
    }
    if (globalQueryHistory.indexOf(globalQuery) === -1 && globalQuery !== "*") {
        globalQueryHistory.push(globalQuery);
        if (globalQueryHistory.length > 5) {
            globalQueryHistory.shift();
        }
    }
    initCardView();
    initWordCloud();
    initTimeLine();
    // initWorldMap();
    // initMap();
    initStateMap();
    // initSocialGraph();
    initBarChart();
}



