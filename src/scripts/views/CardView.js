// Init Tweets list
var cardview_spinner;
var cardview_dataObj = [];

function initCardView() {
    // trigger loader
    var target = document.getElementById('tweet-list-border');
    cardview_spinner = new Spinner(opts).spin(target);
    solr_get_new_tweet_list(globalQuery);
}

function addSolrDataToCardView(oneSerie) {
    $("#tweet-list").empty();
    cardview_spinner.stop();
    cardview_dataObj = oneSerie;
    oneSerie.forEach(function (tweet) {
        $("#tweet-list").append(tweetCard(tweet));
    });
}

String.prototype.replaceAll = function (search, replacement) {

    var target = this;
    // return target.replace(search/g, replacement);
    return target.replace(new RegExp(search, 'g'), replacement);
};

//keyword: {text: 'hello', size: 0.025}

// Generate the view for selected tweet
// This are three parts for tweet card:
// Header Part: title, author, id, date
// Content Part: tweet text
// End Part: refer, retweets infor
function tweetCard(tweet) {

    // console.log(tweet);
    // var cardScreenName = '<div class="card-name">' + tweet.id + '</div>';
    //     console.log(tweet.place_country_code);

    var cardName = '<div class="card-name">' + tweet.id + '</div>';
    var cardContainer = '<div class="card-container">' +
        '<div class="card-avatar-wrap">' +
        // '<img src="https://randomuser.me/api/portraits/med/men/5.jpg" alt="">' +
        // '<img src="http://pbs.twimg.com/profile_images/889153158718607361/C-wT1Dw2_normal.jpg" alt="">' +
        '<img src="./resources/img/twitter-512.png" alt="">' +
        '</div>' +
        '<div class="card-content">' +
        '<div class="card-author-name">' + tweet.user_name + '</div>' +
        '<div class="card-author-screen-name">@' + tweet.user_screen_name + '</div>' +
        '<p>' + tweet.full_text + '</p>' +
        '</div>' +
        '</div>';

    var cardFooter = '<div class="card-name">' + tweet.hash_tags + '</div>';

    if (tweet.hasOwnProperty('post_time')) {
        var cardTimer = '<div class="card-name">' + tweet.post_time + '</div>';
        return "<div class='tweet-card doc panel panel-default' id=" + tweet.id + ">"
            + cardName
            // + "<hr class='masthead-hr' />"
            + cardContainer
            + cardFooter
            + cardTimer
            + "</div>";

    }
    // var cardFooter = '<div class="card-performers"><div class="add-performers"><a href="#"><img src="/src/assets/images/gal.png" alt="Add performers"></a><div class="performer"><img src="https://randomuser.me/api/portraits/thumb/men/6.jpg" alt="Performer"></div><div class="performer"><img src="https://randomuser.me/api/portraits/thumb/men/7.jpg" alt="Performer"></div><div class="performer"><img src="https://randomuser.me/api/portraits/thumb/men/8.jpg" alt="Performer"></div></div><div class="delete-performers"><a href="#"><img src="/src/assets/images/del.png" alt="Delete performers"></a><div class="performer"><img src="https://randomuser.me/api/portraits/thumb/men/9.jpg" alt="Performer"></div></div></div>'


    return "<div class='tweet-card doc panel panel-default' id=" + tweet.id + ">"
        + cardName
        // + "<hr class='masthead-hr' />"
        + cardContainer
        + cardFooter
        + "</div>";
}

