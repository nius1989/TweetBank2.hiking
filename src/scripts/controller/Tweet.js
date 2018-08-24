/**
 * Created by Shuo on 10/24/2017.
 */
function Tweet(jsonDoc) {
    var tweet = {};

    //tweet meta
    tweet.id = jsonDoc.hasOwnProperty(field_tweet_id) ? jsonDoc[field_tweet_id] : "";//tweet id
    tweet.post_time = jsonDoc.hasOwnProperty(field_post_time) ? new Date(jsonDoc[field_post_time]).toDateString() : "";//tweet time
    tweet.retweet_count = jsonDoc.hasOwnProperty(field_retweet_count) ? jsonDoc[field_retweet_count] : 0;//times of retweet
    tweet.favorite_count = jsonDoc.hasOwnProperty(field_favorite_count) ? jsonDoc[field_favorite_count] : 0;//times of favorite
    tweet.user_location = jsonDoc.hasOwnProperty(field_user_location) ? jsonDoc[field_user_location] : 0;//times of favorite
    // tweet.place_country_code = jsonDoc.hasOwnProperty(field_user_location) ? jsonDoc[field_user_location] : "";//times of favorite

    //tweet information
    tweet.full_text = jsonDoc.hasOwnProperty(field_tweet_content) ? jsonDoc[field_tweet_content] : "empty" +
        "3";//the full text of the tweets
    tweet.hash_tags = jsonDoc.hasOwnProperty(field_hastags) ? jsonDoc[field_hastags] : [];//the hashtag list
    tweet.user_mentions_id_str = jsonDoc.hasOwnProperty(field_user_mentions_id_str) ? jsonDoc[field_user_mentions_id_str] : [];//@mentions ids
    tweet.user_mentions_name = jsonDoc.hasOwnProperty(field_user_mentions_name) ? jsonDoc[field_user_mentions_name] : [];//@mentions names
    tweet.user_mentions_screen_name = jsonDoc.hasOwnProperty(field_user_mentions_screen_name) ? jsonDoc[field_user_mentions_screen_name] : [];//@mentions screen names
    tweet.full_text_ner = jsonDoc.hasOwnProperty(field_full_text_ner) ? jsonDoc[field_full_text_ner] : "empty";//@mentions screen names
    // tweet.full_text_ner = replaceTags(tweet.full_text_ner, tweet.hash_tags);
    //tweet.full_text_keywords = getAllKeywords(jsonDoc);

    //twitter user info
    tweet.user_id = jsonDoc.hasOwnProperty(field_user_id_str) ? jsonDoc[field_user_id_str] : "";//id of the twitter
    tweet.user_name = jsonDoc.hasOwnProperty(field_user_name) ? jsonDoc[field_user_name] : "";//user name
    tweet.user_screen_name = jsonDoc.hasOwnProperty(field_user_screen_name) ? jsonDoc[field_user_screen_name] : "";//screen name, full name
    return tweet;
}


String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
